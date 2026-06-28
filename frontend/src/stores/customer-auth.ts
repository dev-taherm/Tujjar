import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setTokens as setApiTokens, clearTokens as clearApiTokens } from "@/api/client";
import type { CustomerProfile, CustomerAuthTokens } from "@/api/customer-auth";

interface CustomerAuthState {
  customer: CustomerProfile | null;
  tokens: CustomerAuthTokens | null;
  isAuthenticated: boolean;
  setCustomer: (customer: CustomerProfile | null) => void;
  setTokens: (tokens: CustomerAuthTokens | null) => void;
  logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      customer: null,
      tokens: null,
      isAuthenticated: false,
      setCustomer: (customer) => set({ customer, isAuthenticated: !!customer }),
      setTokens: (tokens) => {
        if (tokens) {
          setApiTokens(tokens.access, tokens.refresh, "customer");
        }
        set({ tokens });
      },
      logout: () => {
        clearApiTokens();
        set({
          customer: null,
          tokens: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "tujjar-customer-auth",
      partialize: (state) => ({
        customer: state.customer,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.tokens?.access && state?.tokens?.refresh) {
          setApiTokens(state.tokens.access, state.tokens.refresh, "customer");
        }
      },
    },
  ),
);
