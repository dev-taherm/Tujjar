import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Page, PageVersion, SectionDefinition } from "@/shared/types";

export const pagesApi = {
  list: async (storeId?: string): Promise<Page[]> => {
    const params = storeId ? `?store=${storeId}` : "";
    const { data } = await apiClient.get(`/pages/${params}`);
    return data.results || data;
  },

  get: async (id: string): Promise<Page> => {
    const { data } = await apiClient.get(`/pages/${id}/`);
    return data;
  },

  create: async (payload: { title: string; slug: string; store: string; page_type?: string }): Promise<Page> => {
    const { data } = await apiClient.post("/pages/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Page>): Promise<Page> => {
    const { data } = await apiClient.patch(`/pages/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/pages/${id}/`);
  },

  publish: async (id: string): Promise<Page> => {
    const { data } = await apiClient.post(`/pages/${id}/publish/`);
    return data;
  },

  unpublish: async (id: string): Promise<Page> => {
    const { data } = await apiClient.post(`/pages/${id}/unpublish/`);
    return data;
  },

  getVersions: async (id: string): Promise<PageVersion[]> => {
    const { data } = await apiClient.get(`/pages/${id}/versions/`);
    return data;
  },

  restoreVersion: async (id: string, version: number): Promise<Page> => {
    const { data } = await apiClient.post(`/pages/${id}/versions/${version}/restore/`);
    return data;
  },

  addSection: async (pageId: string, sectionType: string, position?: number): Promise<Page> => {
    const payload: Record<string, unknown> = { type: sectionType };
    if (position !== undefined) payload.position = position;
    const { data } = await apiClient.post(`/pages/${pageId}/sections/add/`, payload);
    return data;
  },

  updateSection: async (pageId: string, sectionId: string, settings: Record<string, unknown>): Promise<Page> => {
    const { data } = await apiClient.patch(`/pages/${pageId}/sections/${sectionId}/`, { settings });
    return data;
  },

  removeSection: async (pageId: string, sectionId: string): Promise<Page> => {
    const { data } = await apiClient.delete(`/pages/${pageId}/sections/${sectionId}/`);
    return data;
  },

  duplicateSection: async (pageId: string, sectionId: string): Promise<Page> => {
    const { data } = await apiClient.post(`/pages/${pageId}/sections/${sectionId}/duplicate/`);
    return data;
  },

  toggleVisibility: async (pageId: string, sectionId: string, device: string): Promise<Page> => {
    const { data } = await apiClient.post(`/pages/${pageId}/sections/${sectionId}/toggle-visibility/`, { device });
    return data;
  },

  reorderSections: async (pageId: string, sectionIds: string[]): Promise<Page> => {
    const { data } = await apiClient.post(`/pages/${pageId}/sections/reorder/`, { section_ids: sectionIds });
    return data;
  },

  getSectionTypes: async (): Promise<SectionDefinition[]> => {
    const { data } = await apiClient.get("/pages/section-types/");
    return data;
  },
};

export function usePages(storeId?: string) {
  return useQuery({
    queryKey: ["pages", storeId],
    queryFn: () => pagesApi.list(storeId),
  });
}

export function usePage(id: string) {
  return useQuery({
    queryKey: ["pages", id],
    queryFn: () => pagesApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pagesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Page>) =>
      pagesApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["pages", variables.id] });
    },
  });
}

export function usePublishPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pagesApi.publish,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["pages", id] });
    },
  });
}

export function useUnpublishPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pagesApi.unpublish,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["pages", id] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pagesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}

export function usePageSectionTypes() {
  return useQuery({
    queryKey: ["pages", "section-types"],
    queryFn: pagesApi.getSectionTypes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, sectionType, position }: { pageId: string; sectionType: string; position?: number }) =>
      pagesApi.addSection(pageId, sectionType, position),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pages", variables.pageId] });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, sectionId, settings }: { pageId: string; sectionId: string; settings: Record<string, unknown> }) =>
      pagesApi.updateSection(pageId, sectionId, settings),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pages", variables.pageId] });
    },
  });
}

export function useRemoveSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, sectionId }: { pageId: string; sectionId: string }) =>
      pagesApi.removeSection(pageId, sectionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pages", variables.pageId] });
    },
  });
}

export function useDuplicateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, sectionId }: { pageId: string; sectionId: string }) =>
      pagesApi.duplicateSection(pageId, sectionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pages", variables.pageId] });
    },
  });
}

export function useToggleSectionVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, sectionId, device }: { pageId: string; sectionId: string; device: string }) =>
      pagesApi.toggleVisibility(pageId, sectionId, device),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pages", variables.pageId] });
    },
  });
}

export function useReorderSections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, sectionIds }: { pageId: string; sectionIds: string[] }) =>
      pagesApi.reorderSections(pageId, sectionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pages", variables.pageId] });
    },
  });
}
