import { request } from "./_request";

export const exerciseApi = {
  getAll: () =>
    request<any[]>("/api/exercicios"),
};
