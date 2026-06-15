import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { Plan, Subscription, Invoice, PaymentMethod } from "@/shared/types";

export const billingApi = {
  getPlans: async (): Promise<Plan[]> => {
    const { data } = await apiClient.get("/billing/plans/");
    return unwrapResults(data);
  },

  getSubscription: async (): Promise<Subscription | null> => {
    try {
      const { data } = await apiClient.get("/billing/subscription/");
      const results = unwrapResults(data);
      return Array.isArray(results) ? results[0] || null : results;
    } catch {
      return null;
    }
  },

  checkout: async (planSlug: string, successUrl: string, cancelUrl: string) => {
    const { data } = await apiClient.post("/billing/subscription/checkout/", {
      plan_slug: planSlug, success_url: successUrl, cancel_url: cancelUrl,
    });
    return data;
  },

  cancelSubscription: async () => {
    const { data } = await apiClient.post("/billing/subscription/cancel/");
    return data;
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const { data } = await apiClient.get("/billing/invoices/");
    return unwrapResults(data);
  },

  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const { data } = await apiClient.get("/billing/payment-methods/");
    return unwrapResults(data);
  },

  setDefaultPaymentMethod: async (id: string) => {
    const { data } = await apiClient.post(`/billing/payment-methods/${id}/set_default/`);
    return data;
  },
};

export function usePlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: billingApi.getPlans,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: billingApi.getSubscription,
  });
}

export function useBillingCheckout() {
  return useMutation({
    mutationFn: ({ planSlug, successUrl, cancelUrl }: { planSlug: string; successUrl: string; cancelUrl: string }) =>
      billingApi.checkout(planSlug, successUrl, cancelUrl),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: billingApi.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: billingApi.getInvoices,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["billing", "payment-methods"],
    queryFn: billingApi.getPaymentMethods,
  });
}
