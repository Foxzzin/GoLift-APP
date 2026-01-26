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
      const storedUser = await storage.getUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Erro ao carregar utilizador:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await authApi.login(email, password);
      
      // O backend retorna os dados do user diretamente (não dentro de response.user)
      if (response.sucesso) {
        const userData: User = {
          id: response.id,
          nome: response.nome,
          email: response.email,
          tipo: response.tipo,
        };
        setUser(userData);
        await storage.saveUser(userData);
        router.replace("/(tabs)");
      } else {
        throw new Error("Credenciais inválidas");
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
