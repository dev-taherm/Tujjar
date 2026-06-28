import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setCustomerTokens, clearCustomerTokens } from "@/api/customer-client";
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
          setCustomerTokens(tokens.access, tokens.refresh);
        }
        set({ tokens });
      },
      logout: () => {
        clearCustomerTokens();
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
          setCustomerTokens(state.tokens.access, state.tokens.refresh);
        }
      },
    },
  ),
);
