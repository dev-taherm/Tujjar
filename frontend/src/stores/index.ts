import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setTokens as setApiTokens, clearTokens as clearApiTokens } from "@/api/client";
import type { User, AuthTokens, Organization } from "@/shared/types";

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  organization: Organization | null;
  role: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setOrganization: (org: Organization | null) => void;
  setRole: (role: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      organization: null,
      role: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (tokens) => {
        if (tokens) {
          setApiTokens(tokens.access, tokens.refresh);
        }
        set({ tokens });
      },
      setOrganization: (organization) => set({ organization }),
      setRole: (role) => set({ role }),
      logout: () => {
        clearApiTokens();
        set({
          user: null,
          tokens: null,
          organization: null,
          role: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "tujjar-auth",
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
        organization: state.organization,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.tokens?.access && state?.tokens?.refresh) {
          setApiTokens(state.tokens.access, state.tokens.refresh);
        }
      },
    }
  )
);

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: "system",
  setTheme: (theme) => set({ theme }),
}));
