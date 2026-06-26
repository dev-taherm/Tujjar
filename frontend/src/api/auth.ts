import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, setTokens, clearTokens } from "./client";
import type { AuthTokens, User } from "@/shared/types";

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; tokens: AuthTokens; requires_2fa?: boolean; two_factor_session_token?: string; requires_email_verification?: boolean }> => {
    const { data } = await apiClient.post("/auth/login/", { email, password });
    if (data.requires_2fa) {
      return { user: data.user, tokens: { access: "", refresh: "" }, requires_2fa: true, two_factor_session_token: data.two_factor_session_token };
    }
    const tokens = data.tokens || { access: data.access, refresh: data.refresh };
    setTokens(tokens.access, tokens.refresh);
    return { user: data.user, tokens, requires_email_verification: data.requires_email_verification };
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

  resendVerification: async (email: string) => {
    const { data } = await apiClient.post("/auth/verify-email/resend/", { email });
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

  // 2FA methods
  setup2FA: async (): Promise<{ secret: string; provisioning_uri: string }> => {
    const { data } = await apiClient.post("/auth/2fa/setup/");
    return data;
  },

  verify2FA: async (code: string) => {
    const { data } = await apiClient.post("/auth/2fa/verify/", { code });
    return data;
  },

  disable2FA: async (password: string) => {
    const { data } = await apiClient.post("/auth/2fa/disable/", { password });
    return data;
  },

  login2FA: async (sessionToken: string, code: string): Promise<{ user: User; tokens: AuthTokens }> => {
    const { data } = await apiClient.post("/auth/2fa/login/", {
      two_factor_session_token: sessionToken,
      code,
    });
    const tokens = data.tokens || { access: data.access, refresh: data.refresh };
    setTokens(tokens.access, tokens.refresh);
    return { user: data.user, tokens };
  },

  login2FAWithBackup: async (sessionToken: string, backupCode: string): Promise<{ user: User; tokens: AuthTokens }> => {
    const { data } = await apiClient.post("/auth/2fa/login/backup/", {
      two_factor_session_token: sessionToken,
      backup_code: backupCode,
    });
    const tokens = data.tokens || { access: data.access, refresh: data.refresh };
    setTokens(tokens.access, tokens.refresh);
    return { user: data.user, tokens };
  },

  generateBackupCodes: async (): Promise<{ backup_codes: string[]; count: number }> => {
    const { data } = await apiClient.post("/auth/2fa/backup-codes/");
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
