import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { UUID } from "@/shared/types";

export interface Template {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  version: string;
  category: string;
  author: string;
  thumbnail: string;
  preview_images: string[];
  tags: string[];
  is_system: boolean;
  is_premium: boolean;
  page_count: number;
  config: Record<string, unknown>;
  presets: Array<{ name: string; config: Record<string, unknown> }>;
  pages: Array<{
    title: string;
    slug: string;
    page_type: string;
    is_published?: boolean;
    sections: Array<{
      type: string;
      settings: Record<string, unknown>;
    }>;
  }>;
  navigation: {
    logo_text: string;
    links: Array<{ label: string; url: string; order?: number }>;
    cta_button?: { label: string; url: string; enabled: boolean };
  };
  footer: {
    columns: Array<{
      title: string;
      links: Array<{ label: string; url: string }>;
    }>;
    copyright: string;
    social_links: Record<string, string>;
  };
  seo_defaults: Record<string, string>;
  demo_content: {
    collections: Array<{ name: string; slug: string; description?: string }>;
    categories: Array<{ name: string; slug: string; description?: string }>;
  };
  store_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const templatesApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<{ results: Template[] }>("/templates/", { params }).then((r) => r.data),

  get: (id: UUID) =>
    apiClient.get<Template>(`/templates/${id}/`).then((r) => r.data),

  installed: (storeId: UUID) =>
    apiClient.get<Template | null>("/templates/installed/", { params: { store_id: storeId } }).then((r) => r.data),

  install: (id: UUID, storeId: UUID) =>
    apiClient.post(`/templates/${id}/install/`, { store_id: storeId }).then((r) => r.data),

  preview: (id: UUID) =>
    apiClient.get<Template>(`/templates/${id}/preview/`).then((r) => r.data),

  exportTheme: (id: UUID) =>
    apiClient.get(`/templates/${id}/export/`).then((r) => r.data),

  importTemplate: (data: Record<string, unknown>) =>
    apiClient.post("/templates/import/", { data }).then((r) => r.data),

  marketplace: (params?: Record<string, string>) =>
    apiClient.get<{ results: Template[] }>("/templates/marketplace/", { params }).then((r) => r.data),
};

export function useTemplates(category?: string) {
  return useQuery({
    queryKey: ["templates", category].filter(Boolean),
    queryFn: () => templatesApi.list(category ? { category } : undefined),
  });
}

export function useTemplate(id: UUID | null) {
  return useQuery({
    queryKey: ["templates", id],
    queryFn: () => templatesApi.get(id!),
    enabled: !!id,
  });
}

export function useTemplateMarketplace(category?: string) {
  return useQuery({
    queryKey: ["templates", "marketplace", category].filter(Boolean),
    queryFn: () => templatesApi.marketplace(category ? { category } : undefined),
  });
}

export function useInstallTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, storeId }: { templateId: UUID; storeId: UUID }) =>
      templatesApi.install(templateId, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}

export function useInstalledTemplate(storeId: UUID | null) {
  return useQuery({
    queryKey: ["templates", "installed", storeId],
    queryFn: () => templatesApi.installed(storeId!),
    enabled: !!storeId,
  });
}
