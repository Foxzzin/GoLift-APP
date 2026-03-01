import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { router } from "expo-router";
import { authApi } from "../services/api";
import storage from "../services/storage";
import { User } from "../types";

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  nome: string;
  email: string;
  password: string;
  idade?: number;
  peso?: number;
  altura?: number;
  objetivo?: string;
  pesoAlvo?: number;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar utilizador ao iniciar a app
  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const [storedUser, token] = await Promise.all([
        storage.getUser(),
        storage.getToken(),
      ]);

      if (!storedUser || !token) return;

      // Verificar expiração do token sem biblioteca externa
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padding = '='.repeat((4 - base64Payload.length % 4) % 4);
          const payload = JSON.parse(atob(base64Payload + padding));
          if (typeof payload.exp === 'number' && payload.exp < Date.now() / 1000) {
            // Token expirado — logout silencioso
            await storage.clear();
            return;
          }
        }
      } catch {
        // Se não for possível decodificar o token, deixar o servidor rejeitar
      }

      setUser(storedUser);
    } catch (error) {
      console.error("Erro ao carregar utilizador:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await authApi.login(email, password);
      if (
        response.sucesso &&
        response.user &&
        typeof response.user.id === "number" &&
        typeof response.user.nome === "string" &&
        typeof response.user.email === "string"
      ) {
        const userData: User = {
          id: response.user.id,
          nome: response.user.nome,
          email: response.user.email,
          tipo: response.user.tipo,
        };
        setUser(userData);
        await storage.saveUser(userData);
        router.replace("/(tabs)");
      } else if (response.erro) {
        throw new Error(response.erro);
      } else {
        throw new Error("Resposta inválida do servidor. Tenta novamente.");
      }
    } catch (error) {
      throw error;
    }
  }

  async function register(data: RegisterData) {
    try {
      const response = await authApi.register(data);
      
      if (response.sucesso) {
        // Após registo, fazer login automático
        await login(data.email, data.password);
      } else {
        throw new Error(response.message || "Erro ao registar");
      }
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await storage.clear();
      setUser(null);
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
