import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { Customer } from "@/shared/types";

export const customersApi = {
  list: async (params?: { store?: string; search?: string }): Promise<Customer[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/customers/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },

  get: async (id: string): Promise<Customer> => {
    const { data } = await apiClient.get(`/customers/${id}/`);
    return data;
  },

  create: async (payload: Partial<Customer>): Promise<Customer> => {
    const { data } = await apiClient.post("/customers/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Customer>): Promise<Customer> => {
    const { data } = await apiClient.patch(`/customers/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/customers/${id}/`);
  },
};

export function useCustomers(params?: { store?: string; search?: string }) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customersApi.list(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Customer>) =>
      customersApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
