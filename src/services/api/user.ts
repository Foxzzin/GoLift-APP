import { request } from "./_request";

export const userApi = {
  getProfile: (userId: number) =>
    request<any>(`/api/profile/${userId}`),

  updateProfile: (userId: number, data: any) =>
    request<any>(`/api/profile/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
