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

  // Criar AbortController com timeout de 30 segundos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.erro || error.message || "Erro na requisição");
    }
    
    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`Erro ao conectar a ${url}:`, error.message);
    // Enriquecer o erro com contexto para debug
    const enriched = new Error(`[${error.name}] ${error.message} → ${url}`);
    enriched.name = error.name || "NetworkError";
    throw enriched;
  }
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
  getUserWorkouts: (userId: number) =>
    request<any[]>(`/api/treino/${userId}`),

  createWorkout: (userId: number, nome: string, exercicios: number[]) =>
    request<{ sucesso: boolean; id_treino: number }>("/api/treino", {
      method: "POST",
      body: JSON.stringify({ userId, nome, exercicios }),
    }),

  copyWorkout: (userId: number, nome: string, exercicios: number[]) =>
    request<{ sucesso: boolean; id_treino: number }>("/api/treino/copiar", {
      method: "POST",
      body: JSON.stringify({ userId, nome, exercicios }),
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
      body: JSON.stringify({ userId, treinoId, duracao_segundos, series }),
    }),

  // Obter exercícios de um treino específico
  getWorkoutExercises: async (treinoId: number) => {
    try {
      return await request<any>(`/api/treino-user/${treinoId}/exercicios`);
    } catch (err: any) {
      // Em caso de erro, retornar array vazio em vez de falhar
      return { sucesso: false, exercicios: [] };
    }
  },
};

// Métricas
export const metricsApi = {
  getHistory: (userId: number) =>
    request<any>(`/api/sessoes/${userId}`),

  getRecords: (userId: number) =>
    request<any[]>(`/api/recordes/${userId}`),

  getStreak: (userId: number) =>
    request<{ sucesso: boolean; streak: number; maxStreak: number; totalDays: number }>(`/api/streak/${userId}`),

  // Get full workout session details with exercises and series
  getSessionDetails: (sessaoId: number) =>
    request<any>(`/api/treino-sessao-detalhes/${sessaoId}`),

  // Stats não existe no backend, vamos calcular a partir das sessões
  getStats: (userId: number) =>
    request<any>(`/api/sessoes/${userId}`).then((sessoes: any) => {
      const sessoesList = Array.isArray(sessoes) ? sessoes : [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calcular início da semana atual (Segunda-feira)
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
        avgDuration: sessoesList.length > 0 
          ? Math.round(sessoesList.reduce((acc: number, s: any) => acc + (s.duracao_segundos || 0), 0) / sessoesList.length)
          : 0,
      };
    }),
};

// Comunidades
export const communitiesApi = {
  // Obter todas as comunidades verificadas
  getCommunities: () =>
    request<any[]>("/api/comunidades"),

  // Obter comunidades do utilizador
  getUserCommunities: (userId: number) =>
    request<any[]>(`/api/comunidades/user/${userId}`),

  // Criar comunidade
  createCommunity: (data: { nome: string; descricao: string; criador_id: number; pais?: string; privada?: boolean }) =>
    request<any>("/api/comunidades", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Editar comunidade (apenas o criador)
  updateCommunity: (comunidadeId: number, data: { criador_id: number; nome?: string; descricao?: string; pais?: string; privada?: boolean }) =>
    request<any>(`/api/comunidades/${comunidadeId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Entrar numa comunidade
  joinCommunity: (comunidadeId: number, userId: number) =>
    request<any>(`/api/comunidades/${comunidadeId}/join`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  // Sair de uma comunidade
  leaveCommunity: (comunidadeId: number, userId: number) =>
    request<any>(`/api/comunidades/${comunidadeId}/leave`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  // Enviar mensagem
  sendMessage: (comunidadeId: number, userId: number, mensagem: string) =>
    request<any>(`/api/comunidades/${comunidadeId}/mensagens`, {
      method: "POST",
      body: JSON.stringify({ userId, mensagem }),
    }),

  // Obter mensagens de uma comunidade
  getCommunityMessages: (comunidadeId: number) =>
    request<any[]>(`/api/comunidades/${comunidadeId}/mensagens`),

  // Obter membros de uma comunidade
  getCommunityMembers: (comunidadeId: number) =>
    request<any[]>(`/api/comunidades/${comunidadeId}/membros`),

  // Admin: obter todas as comunidades (verificadas + pendentes)
  getAllCommunitiesAdmin: () =>
    request<any[]>("/api/admin/comunidades"),

  // Admin: obter comunidades não verificadas
  getPendingCommunities: () =>
    request<any[]>("/api/admin/comunidades/pendentes"),

  // Admin: verificar comunidade
  verifyCommunity: (comunidadeId: number) =>
    request<any>(`/api/admin/comunidades/${comunidadeId}/verificar`, {
      method: "POST",
    }),

  // Admin: toggle verificação
  toggleVerification: (comunidadeId: number, verificada: boolean) =>
    request<any>(`/api/admin/comunidades/${comunidadeId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ verificada }),
    }),

  // Admin: rejeitar comunidade
  rejectCommunity: (comunidadeId: number) =>
    request<any>(`/api/admin/comunidades/${comunidadeId}/rejeitar`, {
      method: "POST",
    }),
};

// Admin
export const adminApi = {
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

  createExercise: (data: { nome: string; descricao?: string; grupo_tipo?: string; sub_tipo?: string; video?: string }) =>
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
    }>(`/api/ai/report/${userId}`),

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
    }),

  importPlanDay: (
    userId: number,
    dia: string,
    foco: string,
    exercicios: Array<{ nome?: string; exercicio?: string; series: number; repeticoes: string; observacao?: string }>
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

export default {
  auth: authApi,
  user: userApi,
  exercise: exerciseApi,
  workout: workoutApi,
  metrics: metricsApi,
  communities: communitiesApi,
  admin: adminApi,
  plano: planoApi,
};
