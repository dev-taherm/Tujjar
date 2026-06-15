import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { Order, Cart } from "@/shared/types";

export const ordersApi = {
  list: async (params?: { store?: string; status?: string; search?: string }): Promise<Order[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/orders/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },

  get: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get(`/orders/${id}/`);
    return data;
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/update_status/`, { status });
    return data;
  },

  updatePaymentStatus: async (id: string, payment_status: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/update_payment_status/`, { payment_status });
    return data;
  },

  ship: async (id: string, tracking_number?: string, tracking_url?: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/ship/`, { tracking_number, tracking_url });
    return data;
  },

  deliver: async (id: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/deliver/`);
    return data;
  },

  cancel: async (id: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/cancel/`);
    return data;
  },

  addNote: async (id: string, note_type: string, note: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/add_note/`, { note_type, note });
    return data;
  },
};

export const cartsApi = {
  list: async (params?: { store?: string; status?: string }): Promise<Cart[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.status) searchParams.set("status", params.status);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/carts/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },

  get: async (id: string): Promise<Cart> => {
    const { data } = await apiClient.get(`/carts/${id}/`);
    return data;
  },

  addItem: async (id: string, product: string, quantity: number, variant?: string): Promise<Cart> => {
    const payload: Record<string, unknown> = { product, quantity };
    if (variant) payload.variant = variant;
    const { data } = await apiClient.post(`/carts/${id}/items/add/`, payload);
    return data;
  },

  updateItem: async (id: string, item_id: string, quantity: number): Promise<Cart> => {
    const { data } = await apiClient.post(`/carts/${id}/items/update/`, { item_id, quantity });
    return data;
  },

  removeItem: async (id: string, item_id: string): Promise<Cart> => {
    const { data } = await apiClient.post(`/carts/${id}/items/remove/`, { item_id });
    return data;
  },

  checkout: async (id: string, payload: Record<string, unknown>): Promise<Order> => {
    const { data } = await apiClient.post(`/carts/${id}/checkout/`, payload);
    return data;
  },
};

export function useOrders(params?: { store?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersApi.list(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useShipOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tracking_number, tracking_url }: { id: string; tracking_number?: string; tracking_url?: string }) =>
      ordersApi.ship(id, tracking_number, tracking_url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useDeliverOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.deliver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCarts(params?: { store?: string; status?: string }) {
  return useQuery({
    queryKey: ["carts", params],
    queryFn: () => cartsApi.list(params),
  });
}

export function useCart(id: string) {
  return useQuery({
    queryKey: ["carts", id],
    queryFn: () => cartsApi.get(id),
    enabled: !!id,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, product, quantity, variant }: { id: string; product: string; quantity: number; variant?: string }) =>
      cartsApi.addItem(id, product, quantity, variant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carts"] });
    },
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; [key: string]: unknown }) =>
      cartsApi.checkout(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carts"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
