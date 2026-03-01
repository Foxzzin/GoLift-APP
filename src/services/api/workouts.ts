import { request } from "./_request";

export const workoutApi = {
  getUserWorkouts: (userId: number) =>
    request<any[]>(`/api/treino/${userId}`),

  createWorkout: (userId: number, nome: string, exercicios: number[]) =>
    request<{ sucesso: boolean; id_treino: number }>("/api/treino", {
      method: "POST",
      body: JSON.stringify({ nome, exercicios }),
    }),

  updateWorkout: (userId: number, treinoId: number, nome: string, exercicios: number[]) =>
    request<{ sucesso: boolean }>(`/api/treino/${userId}/${treinoId}`, {
      method: "PUT",
      body: JSON.stringify({ nome, exercicios }),
    }),

  deleteWorkout: (userId: number, treinoId: number) =>
    request<{ sucesso: boolean }>(`/api/treino/${userId}/${treinoId}`, {
      method: "DELETE",
    }),

  // Guardar sessão de treino completa num único request
  saveSession: (
    userId: number,
    treinoId: number,
    duracao_segundos: number,
    series: { id_exercicio: number; numero_serie: number; repeticoes: number; peso: number }[]
  ) =>
    request<{ sucesso: boolean; id_sessao: number }>("/api/treino/sessao/guardar", {
      method: "POST",
      body: JSON.stringify({ treinoId, duracao_segundos, series }),
    }),

  // Obter exercícios de um treino específico
  getWorkoutExercises: async (treinoId: number) => {
    try {
      return await request<any>(`/api/treino-user/${treinoId}/exercicios`);
    } catch (err: any) {
      return { sucesso: false, exercicios: [] };
    }
  },
};
