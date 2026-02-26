import { request } from "./_request";

export const communitiesApi = {
  getCommunities: () =>
    request<any[]>("/api/comunidades"),

  getUserCommunities: (userId: number) =>
    request<any[]>(`/api/comunidades/user/${userId}`),

  createCommunity: (data: {
    nome: string;
    descricao: string;
    criador_id: number;
    pais?: string;
    privada?: boolean;
  }) =>
    request<any>("/api/comunidades", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCommunity: (
    comunidadeId: number,
    data: { criador_id: number; nome?: string; descricao?: string; pais?: string; privada?: boolean }
  ) =>
    request<any>(`/api/comunidades/${comunidadeId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  joinCommunity: (comunidadeId: number, userId: number) =>
    request<any>(`/api/comunidades/${comunidadeId}/join`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  leaveCommunity: (comunidadeId: number, userId: number) =>
    request<any>(`/api/comunidades/${comunidadeId}/leave`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  sendMessage: (comunidadeId: number, userId: number, mensagem: string) =>
    request<any>(`/api/comunidades/${comunidadeId}/mensagens`, {
      method: "POST",
      body: JSON.stringify({ userId, mensagem }),
    }),

  getCommunityMessages: (comunidadeId: number) =>
    request<any[]>(`/api/comunidades/${comunidadeId}/mensagens`),

  getCommunityMembers: (comunidadeId: number) =>
    request<any[]>(`/api/comunidades/${comunidadeId}/membros`),

  // Admin
  getAllCommunitiesAdmin: () =>
    request<any[]>("/api/admin/comunidades"),

  getPendingCommunities: () =>
    request<any[]>("/api/admin/comunidades/pendentes"),

  verifyCommunity: (comunidadeId: number) =>
    request<any>(`/api/admin/comunidades/${comunidadeId}/verificar`, {
      method: "POST",
    }),

  toggleVerification: (comunidadeId: number, verificada: boolean) =>
    request<any>(`/api/admin/comunidades/${comunidadeId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ verificada }),
    }),

  rejectCommunity: (comunidadeId: number) =>
    request<any>(`/api/admin/comunidades/${comunidadeId}/rejeitar`, {
      method: "POST",
    }),
};
