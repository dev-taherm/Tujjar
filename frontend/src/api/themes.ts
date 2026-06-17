import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { Theme, ThemePreset } from "@/shared/types";

export interface ThemeVersion {
  id: string;
  version: string;
  note: string;
  created_at: string;
  created_by: string | null;
}

export const themesApi = {
  list: async (): Promise<Theme[]> => {
    const { data } = await apiClient.get("/themes/");
    return unwrapResults(data);
  },

  get: async (id: string): Promise<Theme> => {
    const { data } = await apiClient.get(`/themes/${id}/`);
    return data;
  },

  create: async (payload: { name: string; slug: string; config?: Record<string, unknown> }): Promise<Theme> => {
    const { data } = await apiClient.post("/themes/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Theme>): Promise<Theme> => {
    const { data } = await apiClient.patch(`/themes/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/themes/${id}/`);
  },

  install: async (id: string, storeId?: string): Promise<Theme> => {
    const { data } = await apiClient.post(`/themes/${id}/install/`, storeId ? { store_id: storeId } : {});
    return data;
  },

  duplicate: async (id: string, name: string): Promise<Theme> => {
    const { data } = await apiClient.post(`/themes/${id}/duplicate/`, { name });
    return data;
  },

  exportTheme: async (id: string) => {
    const { data } = await apiClient.get(`/themes/${id}/export/`, { responseType: "blob" });
    return data;
  },

  marketplace: async (category?: string): Promise<Theme[]> => {
    const params = category ? { category } : {};
    const { data } = await apiClient.get("/themes/marketplace/", { params });
    return unwrapResults(data);
  },

  getPresets: async (themeId: string): Promise<ThemePreset[]> => {
    const { data } = await apiClient.get(`/themes/${themeId}/presets/`);
    return unwrapResults(data);
  },

  createPreset: async (themeId: string, payload: { name: string; config: Record<string, unknown> }): Promise<ThemePreset> => {
    const { data } = await apiClient.post(`/themes/${themeId}/presets/`, payload);
    return data;
  },

  getVersions: async (themeId: string): Promise<ThemeVersion[]> => {
    const { data } = await apiClient.get(`/themes/${themeId}/versions/`);
    return data;
  },

  rollback: async (themeId: string, versionId: string): Promise<Theme> => {
    const { data } = await apiClient.post(`/themes/${themeId}/rollback/`, { version_id: versionId });
    return data;
  },

  importTheme: async (payload: { name: string; config: Record<string, unknown>; sections_schema?: Record<string, unknown>; assets?: Record<string, unknown>; presets?: Array<{ name: string; config: Record<string, unknown> }>; category?: string } | File): Promise<Theme> => {
    if (payload instanceof File) {
      const formData = new FormData();
      formData.append("file", payload);
      const { data } = await apiClient.post("/themes/import/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    }
    const { data } = await apiClient.post("/themes/import/", payload);
    return data;
  },
};

export function useThemes() {
  return useQuery({
    queryKey: ["themes"],
    queryFn: themesApi.list,
  });
}

export function useTheme(id: string) {
  return useQuery({
    queryKey: ["themes", id],
    queryFn: () => themesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: themesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    },
  });
}

export function useUpdateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Theme>) =>
      themesApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["themes", variables.id] });
    },
  });
}

export function useInstallTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storeId }: { id: string; storeId?: string }) =>
      themesApi.install(id, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useThemeMarketplace(category?: string) {
  return useQuery({
    queryKey: ["themes", "marketplace", category || ""],
    queryFn: () => themesApi.marketplace(category),
  });
}

export function useThemeVersions(themeId: string) {
  return useQuery({
    queryKey: ["themes", themeId, "versions"],
    queryFn: () => themesApi.getVersions(themeId),
    enabled: !!themeId,
  });
}

export function useRollbackTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ themeId, versionId }: { themeId: string; versionId: string }) =>
      themesApi.rollback(themeId, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["themes", variables.themeId] });
      queryClient.invalidateQueries({ queryKey: ["themes", variables.themeId, "versions"] });
    },
  });
}

export function useImportTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: themesApi.importTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    },
  });
}

export function useDeleteTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: themesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    },
  });
}

export function useDuplicateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => themesApi.duplicate(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    },
  });
}
