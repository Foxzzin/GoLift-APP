import { request } from "./_request";

export const metricsApi = {
  getHistory: (userId: number) =>
    request<any>(`/api/sessoes/${userId}`).then((res: any) =>
      Array.isArray(res) ? res : []
    ),

  getRecords: (userId: number) =>
    request<any[]>(`/api/recordes/${userId}`),

  getStreak: (userId: number) =>
    request<{ sucesso: boolean; streak: number; maxStreak: number; totalDays: number }>(`/api/streak/${userId}`),

  getSessionDetails: (sessaoId: number) =>
    request<any>(`/api/treino-sessao-detalhes/${sessaoId}`),

  // Stats calculados a partir das sessões (não existe endpoint dedicado no backend)
  getStats: (userId: number) =>
    request<any>(`/api/sessoes/${userId}`).then((sessoes: any) => {
      const sessoesList = Array.isArray(sessoes) ? sessoes : [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Início da semana — Segunda-feira
      const dayOfWeek = now.getDay(); // 0=Dom, 1=Seg...
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysFromMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      return {
        totalWorkouts: sessoesList.length,
        thisWeek: sessoesList.filter((s: any) => {
          const date = new Date(s.data_fim || s.data_inicio);
          return date >= startOfWeek;
        }).length,
        thisMonth: sessoesList.filter((s: any) => {
          const date = new Date(s.data_fim || s.data_inicio);
          return date >= startOfMonth;
        }).length,
        totalTime: sessoesList.reduce((acc: number, s: any) => acc + (s.duracao_segundos || 0), 0),
        avgDuration:
          sessoesList.length > 0
            ? Math.round(
                sessoesList.reduce((acc: number, s: any) => acc + (s.duracao_segundos || 0), 0) / sessoesList.length
              )
            : 0,
      };
    }),
};
