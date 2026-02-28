import { request } from "./_request";

import storage from "../storage";

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await request<{ sucesso: boolean; token: string; user: { id: number; nome: string; email: string; tipo: number } }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (response.sucesso && response.token) {
      await storage.saveToken(response.token);
    }
    return response;
  },

  register: (data: {
    nome: string;
    email: string;
    password: string;
    idade?: number;
    peso?: number;
    altura?: number;
    objetivo?: string;
    pesoAlvo?: number;
  }) =>
    request<{ sucesso: boolean; message: string }>("/api/register", {
      method: "POST",
      body: JSON.stringify({
        nome: data.nome,
        email: data.email,
        password: data.password,
        idade: data.idade,
        peso: data.peso,
        altura: data.altura,
        objetivo: data.objetivo,
        peso_alvo: data.pesoAlvo,
      }),
    }),

  // Recuperação de password — Passo 1: solicitar código
  requestPasswordReset: (email: string) =>
    request<{ sucesso: boolean; codigo_teste?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // Recuperação de password — Passo 2: verificar código
  verifyResetCode: (email: string, code: string) =>
    request<{ sucesso: boolean }>("/api/auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),

  // Recuperação de password — Passo 3: redefinir password
  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ sucesso: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    }),

  // Teste de conexão com o servidor
  testConnection: async () => {
    try {
      const result = await request<any>("/api/health");
      return { sucesso: true, mensagem: "Servidor está online", resultado: result };
    } catch (error: any) {
      return { sucesso: false, mensagem: error.message, resultado: null };
    }
  },
};
