import { request } from "./_request";

export interface AdminStats {
  totalUsers: number;
  totalTreinos: number;
  totalExercises: number;
  totalAdmins: number;
  proUsers?: number;
  newUsersThisWeek?: number;
  sessionsThisWeek?: number;
}

export const adminApi = {
  // Estatísticas do dashboard
  getStats: () =>
    request<AdminStats>("/api/admin/stats"),
  // Utilizadores
  getUsers: () =>
    request<any[]>("/api/admin/users"),

  deleteUser: (userId: number) =>
    request<{ sucesso: boolean }>(`/api/admin/users/${userId}`, {
      method: "DELETE",
    }),

  // Exercícios
  getExercises: () =>
    request<any[]>("/api/admin/exercicios"),

  createExercise: (data: {
    nome: string;
    descricao?: string;
    grupo_tipo?: string;
    sub_tipo?: string;
    video?: string;
  }) =>
    request<{ sucesso: boolean }>("/api/admin/exercicios", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteExercise: (nome: string) =>
    request<{ sucesso: boolean }>(`/api/admin/exercicios/${encodeURIComponent(nome)}`, {
      method: "DELETE",
    }),

  // Treinos recomendados
  getWorkouts: () =>
    request<any[]>("/api/treino-admin"),

  createWorkout: (nome: string, exercicios: number[]) =>
    request<{ sucesso: boolean }>("/api/treino-admin", {
      method: "POST",
      body: JSON.stringify({ nome, exercicios }),
    }),

  deleteWorkout: (id: number) =>
    request<{ sucesso: boolean }>(`/api/treino-admin/${id}`, {
      method: "DELETE",
    }),
};
