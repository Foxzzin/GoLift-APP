// Serviço de API para comunicação com o backend
// Alterar API_URL para o IP do teu servidor em produção

import { SERVER_CONFIG } from "./server-config";

// Use 10.0.2.2 para emulador Android (aponta para localhost do PC)
// Use o IP local (ex: 192.168.1.11) para dispositivo físico
// O IP é configurável dinamicamente via SERVER_CONFIG.setIP()
const getAPI_URL = () => SERVER_CONFIG.getFullURL();

// Helper para fazer requests
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${getAPI_URL()}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.erro || error.message || "Erro na requisição");
  }
  
  return response.json();
}

// Autenticação
export const authApi = {
  login: (email: string, password: string) =>
    request<{ sucesso: boolean; id: number; nome: string; email: string; tipo: number }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    nome: string;
    email: string;
    password: string;
    idade?: number;
    peso?: number;
    altura?: number;
  }) =>
    request<{ sucesso: boolean; message: string }>("/api/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Recuperação de senha
  requestPasswordReset: (email: string) =>
    request<{ sucesso: boolean; mensagem: string; codigo_teste?: string }>("/api/recuperar-senha", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyResetCode: (email: string, codigo: string) =>
    request<{ sucesso: boolean; mensagem: string }>("/api/verificar-codigo", {
      method: "POST",
      body: JSON.stringify({ email, codigo }),
    }),

  resetPassword: (email: string, codigo: string, novaSenha: string) =>
    request<{ sucesso: boolean; mensagem: string }>("/api/redefinir-senha", {
      method: "POST",
      body: JSON.stringify({ email, codigo, novaSenha }),
    }),
};

// Utilizador
export const userApi = {
  getProfile: (userId: number) =>
    request<any>(`/api/profile/${userId}`),

  updateProfile: (userId: number, data: any) =>
    request<any>(`/api/profile/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Exercícios
export const exerciseApi = {
  getAll: () =>
    request<any[]>("/api/exercicios"),

  getById: (id: number) =>
    request<any>(`/api/exercicio/${id}`),
};

// Treinos
export const workoutApi = {
  // Treinos do utilizador
  getUserWorkouts: (userId: number) =>
    request<any[]>(`/api/treino/${userId}`),

  getWorkoutDetails: (userId: number, workoutId: number) =>
    request<any>(`/api/treino/${userId}/${workoutId}`),

  createWorkout: (userId: number, nome: string, exercicios: number[]) =>
    request<{ sucesso: boolean; id_treino: number }>("/api/treino", {
      method: "POST",
      body: JSON.stringify({ userId, nome, exercicios }),
    }),

  deleteWorkout: (userId: number, workoutId: number) =>
    request<any>(`/api/treino/${userId}/${workoutId}`, {
      method: "DELETE",
    }),

  // Treinos recomendados (admin)
  getAdminWorkouts: () =>
    request<any[]>("/api/treinos-admin"),

  // Iniciar sessão de treino
  startSession: (userId: number, treinoId: number) =>
    request<{ sucesso: boolean; id_sessao: number }>(`/api/treino/${userId}/${treinoId}/iniciar`, {
      method: "POST",
    }),

  // Finalizar sessão de treino
  finishSession: (sessaoId: number, duracao_segundos: number) =>
    request<any>(`/api/treino/sessao/${sessaoId}/finalizar`, {
      method: "POST",
      body: JSON.stringify({ duracao_segundos }),
    }),

  // Registar série
  addSerie: (sessaoId: number, data: { id_exercicio: number; numero_serie: number; repeticoes: number; peso: number }) =>
    request<any>(`/api/treino/sessao/${sessaoId}/serie`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Métricas
export const metricsApi = {
  getHistory: (userId: number) =>
    request<any>(`/api/sessoes/${userId}`),

  getRecords: (userId: number) =>
    request<any[]>(`/api/recordes/${userId}`),

  getStreak: (userId: number) =>
    request<{ sucesso: boolean; streak: number; maxStreak: number; totalDays: number }>(`/api/streak/${userId}`),

  // Stats não existe no backend, vamos calcular a partir das sessões
  getStats: (userId: number) =>
    request<any>(`/api/sessoes/${userId}`).then((sessoes: any) => {
      const sessoesList = Array.isArray(sessoes) ? sessoes : [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return {
        totalWorkouts: sessoesList.length,
        thisWeek: sessoesList.filter((s: any) => {
          const date = new Date(s.data_inicio);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        }).length,
        thisMonth: sessoesList.filter((s: any) => {
          const date = new Date(s.data_inicio);
          return date >= startOfMonth;
        }).length,
        totalTime: sessoesList.reduce((acc: number, s: any) => acc + (s.duracao_segundos || 0), 0),
        avgDuration: sessoesList.length > 0 
          ? Math.round(sessoesList.reduce((acc: number, s: any) => acc + (s.duracao_segundos || 0), 0) / sessoesList.length)
          : 0,
      };
    }),
};

export default {
  auth: authApi,
  user: userApi,
  exercise: exerciseApi,
  workout: workoutApi,
  metrics: metricsApi,
};
