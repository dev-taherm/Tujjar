import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../index";
import type { User } from "@/shared/types";

describe("AuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("should have initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should set user and mark as authenticated", () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      full_name: "Test User",
      avatar: "",
      phone: "",
      is_verified: true,
      is_staff: false,
      is_superuser: false,
      two_factor_enabled: false,
      provider: "email",
      created_at: "2024-01-01T00:00:00Z",
    };
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("should set tokens", () => {
    const mockTokens = { access: "access123", refresh: "refresh123" };
    useAuthStore.getState().setTokens(mockTokens);
    expect(useAuthStore.getState().tokens).toEqual(mockTokens);
  });

  it("should logout and clear state", () => {
    useAuthStore.getState().setUser({ id: "1" } as User);
    useAuthStore.getState().setTokens({ access: "a", refresh: "b" });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().tokens).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
