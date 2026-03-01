import { request } from "./_request";

export const planoApi = {
  getUserPlan: (userId: number) =>
    request<{ plano: "free" | "pago"; ativo_ate: string | null }>(`/api/plano/${userId}`),

  createCheckoutSession: (userId: number) =>
    request<{ sucesso: boolean; url: string; sessionId: string }>("/api/stripe/checkout-session", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  getReport: (userId: number) =>
    request<{
      sucesso: boolean;
      relatorio: {
        avaliacao: string;
        equilibrio: string;
        progressao: string;
        descanso: string;
        melhorias: string[];
      } | null;
      semana_inicio: string;
      cached: boolean;
      pode_gerar?: boolean;
    }>(`/api/ai/report/${userId}`, { timeout: 60000 }),

  getPlan: (userId: number) =>
    request<{
      sucesso: boolean;
      plano: {
        descricao: string;
        split: Array<{
          dia: string;
          foco: string;
          exercicios: Array<{
            nome: string;
            series: number;
            repeticoes: string;
            observacao?: string;
          }>;
        }>;
      } | null;
      mes: string;
      criado_em?: string;
      pode_gerar: boolean;
    }>(`/api/ai/plan/${userId}`),

  generatePlan: (userId: number, diasPorSemana: number = 4) =>
    request<{ sucesso: boolean; plano: object; mes: string }>(`/api/ai/plan/${userId}/generate`, {
      method: "POST",
      body: JSON.stringify({ diasPorSemana }),
      timeout: 60000,
    }),

  importPlanDay: (
    userId: number,
    dia: string,
    foco: string,
    exercicios: Array<{
      nome?: string;
      exercicio?: string;
      series: number;
      repeticoes: string;
      observacao?: string;
    }>
  ) =>
    request<{ sucesso: boolean; id_treino: number; nome: string }>(`/api/ai/plan/${userId}/import-day`, {
      method: "POST",
      body: JSON.stringify({ dia, foco, exercicios }),
    }),

  getDailyPhrase: () =>
    request<{ frase: string; cached: boolean; mock?: boolean }>("/api/daily-phrase"),

  createStripePortal: (userId: number) =>
    request<{ url: string }>("/api/stripe/portal", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
};
