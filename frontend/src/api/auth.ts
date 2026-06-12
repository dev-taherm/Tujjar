import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, setTokens, clearTokens } from "./client";
import type { AuthTokens, User } from "@/shared/types";

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
    const { data } = await apiClient.post("/auth/login/", { email, password });
    const tokens = data.tokens || { access: data.access, refresh: data.refresh };
    setTokens(tokens.access, tokens.refresh);
    return { user: data.user, tokens };
  },

  register: async (payload: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
  }): Promise<{ user: User; tokens: AuthTokens }> => {
    const { data } = await apiClient.post("/auth/register/", payload);
    const tokens = data.tokens || { access: data.access, refresh: data.refresh };
    setTokens(tokens.access, tokens.refresh);
    return { user: data.user, tokens };
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    await apiClient.post("/auth/logout/", { refresh: refreshToken });
    clearTokens();
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get("/auth/users/me/");
    return data;
  },

  updateMe: async (payload: Partial<User>): Promise<User> => {
    const { data } = await apiClient.patch("/auth/users/me/", payload);
    return data;
  },

  verifyEmail: async (token: string) => {
    const { data } = await apiClient.post("/auth/verify-email/", { token });
    return data;
  },

  requestPasswordReset: async (email: string) => {
    const { data } = await apiClient.post("/auth/password-reset/request/", { email });
    return data;
  },

  resetPassword: async (token: string, password: string, passwordConfirm: string) => {
    const { data } = await apiClient.post("/auth/password-reset/confirm/", {
      token,
      password,
      password_confirm: passwordConfirm,
    });
    return data;
  },
};

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: authApi.getMe,
    staleTime: 5 * 60 * 1000,
  });
}
