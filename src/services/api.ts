// Serviço de API para comunicação com o backend
// Alterar API_URL para o IP do teu servidor em produção

const API_URL = "http://localhost:5000";

// Helper para fazer requests
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
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
    request<{ sucesso: boolean; user: any }>("/api/login", {
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
    request<{ sucesso: boolean; message: string }>("/api/registar", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Utilizador
export const userApi = {
  getProfile: (userId: number) =>
    request<any>(`/api/perfil/${userId}`),

  updateProfile: (userId: number, data: any) =>
    request<any>(`/api/perfil/${userId}`, {
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
    request<any[]>(`/api/treinos/${userId}`),

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

  // Completar treino
  completeWorkout: (workoutId: number, data: any) =>
    request<any>(`/api/treino/${workoutId}/completar`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Métricas
export const metricsApi = {
  getHistory: (userId: number) =>
    request<any>(`/api/historico/${userId}`),

  getRecords: (userId: number) =>
    request<any[]>(`/api/recordes/${userId}`),

  getStats: (userId: number) =>
    request<any>(`/api/estatisticas/${userId}`),
};

export default {
  auth: authApi,
  user: userApi,
  exercise: exerciseApi,
  workout: workoutApi,
  metrics: metricsApi,
};
