import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { Store, StoreDomain } from "@/shared/types";

export const storesApi = {
  list: async (): Promise<Store[]> => {
    const { data } = await apiClient.get("/stores/");
    return unwrapResults(data);
  },

  get: async (id: string): Promise<Store> => {
    const { data } = await apiClient.get(`/stores/${id}/`);
    return data;
  },

  create: async (payload: { name: string; slug: string; description?: string }): Promise<Store> => {
    const { data } = await apiClient.post("/stores/", payload);
    return data;
  },

  createWizard: async (payload: {
    name: string;
    slug?: string;
    description?: string;
    template_id?: string | null;
    logo_id?: string | null;
    custom_domain?: string;
  }): Promise<Store> => {
    const { data } = await apiClient.post("/stores/wizard/", payload);
    return data;
  },

  checkSlug: async (slug: string): Promise<{ slug: string; available: boolean }> => {
    const { data } = await apiClient.get(`/stores/check-slug/?slug=${encodeURIComponent(slug)}`);
    return data;
  },

  update: async (id: string, payload: Partial<Store>): Promise<Store> => {
    const { data } = await apiClient.patch(`/stores/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/stores/${id}/`);
  },

  getCurrent: async (): Promise<Store> => {
    const { data } = await apiClient.get("/stores/current/");
    return data;
  },

  updateSettings: async (id: string, settings: Record<string, unknown>): Promise<Store> => {
    const { data } = await apiClient.patch(`/stores/${id}/update-settings/`, { settings });
    return data;
  },

  getDomains: async (storeId: string): Promise<StoreDomain[]> => {
    const { data } = await apiClient.get(`/stores/${storeId}/domains/`);
    return unwrapResults(data);
  },

  addDomain: async (storeId: string, domain: string): Promise<StoreDomain> => {
    const { data } = await apiClient.post(`/stores/${storeId}/domains/`, { domain });
    return data;
  },

  removeDomain: async (storeId: string, domainId: string) => {
    await apiClient.delete(`/stores/${storeId}/domains/${domainId}/`);
  },

  changeSlug: async (id: string, slug: string): Promise<{ slug: string; domain: string }> => {
    const { data } = await apiClient.post(`/stores/${id}/change-slug/`, { slug });
    return data;
  },
};

export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: storesApi.list,
  });
}

export function useStore(id: string) {
  return useQuery({
    queryKey: ["stores", id],
    queryFn: () => storesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useCreateStoreWizard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storesApi.createWizard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useCheckSlug() {
  return useMutation({
    mutationFn: storesApi.checkSlug,
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Store>) =>
      storesApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.id] });
    },
  });
}

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, settings }: { id: string; settings: Record<string, unknown> }) =>
      storesApi.updateSettings(id, settings),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.id] });
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useChangeSlug() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, slug }: { id: string; slug: string }) =>
      storesApi.changeSlug(id, slug),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.id] });
    },
  });
}
