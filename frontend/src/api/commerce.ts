import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Discount {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: string;
  currency: string;
  min_subtotal: string;
  max_uses: number | null;
  used_count: number;
  max_uses_per_customer: number | null;
  valid_from: string | null;
  valid_until: string | null;
  applies_to_all_products: boolean;
  products: string[];
  is_active: boolean;
  created_at: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: string;
  country: string;
  state: string;
  postal_code: string;
  is_default: boolean;
  inclusive: boolean;
  is_active: boolean;
}

export interface ShippingRate {
  id: string;
  zone: string;
  name: string;
  description: string;
  pricing_type: "flat" | "percentage";
  price: string;
  percentage: number | null;
  min_order_subtotal: string | null;
  max_order_subtotal: string | null;
  free_over: string | null;
  transit_time: string;
  is_active: boolean;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string;
  is_active: boolean;
  rates: ShippingRate[];
}

export interface Refund {
  id: string;
  order: string;
  order_number: string;
  amount: string;
  reason: string;
  status: "pending" | "succeeded" | "failed";
  restock: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const discountsApi = {
  list: async (params?: { is_active?: string }): Promise<Discount[]> => {
    const sp = new URLSearchParams();
    if (params?.is_active) sp.set("is_active", params.is_active);
    const qs = sp.toString();
    const { data } = await apiClient.get(`/commerce/discounts/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },
  create: async (payload: Partial<Discount>): Promise<Discount> => {
    const { data } = await apiClient.post("/commerce/discounts/", payload);
    return data;
  },
  update: async (id: string, payload: Partial<Discount>): Promise<Discount> => {
    const { data } = await apiClient.patch(`/commerce/discounts/${id}/`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/commerce/discounts/${id}/`);
  },
};

export const taxesApi = {
  list: async (): Promise<TaxRate[]> => {
    const { data } = await apiClient.get("/commerce/taxes/");
    return unwrapResults(data);
  },
  create: async (payload: Partial<TaxRate>): Promise<TaxRate> => {
    const { data } = await apiClient.post("/commerce/taxes/", payload);
    return data;
  },
  update: async (id: string, payload: Partial<TaxRate>): Promise<TaxRate> => {
    const { data } = await apiClient.patch(`/commerce/taxes/${id}/`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/commerce/taxes/${id}/`);
  },
};

export const shippingZonesApi = {
  list: async (): Promise<ShippingZone[]> => {
    const { data } = await apiClient.get("/commerce/shipping/zones/");
    return unwrapResults(data);
  },
  create: async (payload: Partial<ShippingZone>): Promise<ShippingZone> => {
    const { data } = await apiClient.post("/commerce/shipping/zones/", payload);
    return data;
  },
  update: async (id: string, payload: Partial<ShippingZone>): Promise<ShippingZone> => {
    const { data } = await apiClient.patch(`/commerce/shipping/zones/${id}/`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/commerce/shipping/zones/${id}/`);
  },
};

export const shippingRatesApi = {
  create: async (payload: Partial<ShippingRate>): Promise<ShippingRate> => {
    const { data } = await apiClient.post("/commerce/shipping/rates/", payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/commerce/shipping/rates/${id}/`);
  },
};

export const refundsApi = {
  list: async (params?: { order?: string }): Promise<Refund[]> => {
    const sp = new URLSearchParams();
    if (params?.order) sp.set("order", params.order);
    const qs = sp.toString();
    const { data } = await apiClient.get(`/commerce/refunds/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },
  create: async (payload: { order: string; amount: string; reason?: string; restock?: boolean }): Promise<Refund> => {
    const { data } = await apiClient.post("/commerce/refunds/", payload);
    return data;
  },
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useInvalidate(key: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [key] });
  };
}

export function useDiscounts(params?: { is_active?: string }) {
  return useQuery({
    queryKey: ["discounts", params],
    queryFn: () => discountsApi.list(params),
  });
}

export function useCreateDiscount() {
  const onSuccess = useInvalidate("discounts");
  return useMutation({ mutationFn: discountsApi.create, onSuccess });
}

export function useUpdateDiscount() {
  const onSuccess = useInvalidate("discounts");
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Discount> }) =>
      discountsApi.update(id, payload),
    onSuccess,
  });
}

export function useDeleteDiscount() {
  const onSuccess = useInvalidate("discounts");
  return useMutation({ mutationFn: discountsApi.remove, onSuccess });
}

export function useTaxRates() {
  return useQuery({ queryKey: ["taxes"], queryFn: taxesApi.list });
}

export function useCreateTaxRate() {
  const onSuccess = useInvalidate("taxes");
  return useMutation({ mutationFn: taxesApi.create, onSuccess });
}

export function useUpdateTaxRate() {
  const onSuccess = useInvalidate("taxes");
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TaxRate> }) =>
      taxesApi.update(id, payload),
    onSuccess,
  });
}

export function useDeleteTaxRate() {
  const onSuccess = useInvalidate("taxes");
  return useMutation({ mutationFn: taxesApi.remove, onSuccess });
}

export function useShippingZones() {
  return useQuery({ queryKey: ["shipping-zones"], queryFn: shippingZonesApi.list });
}

export function useCreateShippingZone() {
  const onSuccess = useInvalidate("shipping-zones");
  return useMutation({ mutationFn: shippingZonesApi.create, onSuccess });
}

export function useDeleteShippingZone() {
  const onSuccess = useInvalidate("shipping-zones");
  return useMutation({ mutationFn: shippingZonesApi.remove, onSuccess });
}

export function useCreateShippingRate() {
  const onSuccess = useInvalidate("shipping-zones");
  return useMutation({ mutationFn: shippingRatesApi.create, onSuccess });
}

export function useDeleteShippingRate() {
  const onSuccess = useInvalidate("shipping-zones");
  return useMutation({ mutationFn: shippingRatesApi.remove, onSuccess });
}

export function useRefunds(params?: { order?: string }) {
  return useQuery({
    queryKey: ["refunds", params],
    queryFn: () => refundsApi.list(params),
    enabled: !!params?.order,
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refundsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
