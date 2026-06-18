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

export interface TemplateVersion {
  id: string;
  version: string;
  note: string;
  created_at: string;
  created_by: string | null;
}

export interface TemplateVersionDetail extends TemplateVersion {
  config: Record<string, unknown>;
  pages: Template["pages"];
  navigation: Template["navigation"];
  footer: Template["footer"];
  seo_defaults: Record<string, string>;
  demo_content: Template["demo_content"];
  store_settings: Record<string, unknown>;
}

export interface StoreBackup {
  id: UUID;
  store: UUID;
  template: UUID | null;
  template_name: string;
  pages: Array<{
    title: string;
    slug: string;
    page_type: string;
    content_schema: Record<string, unknown>;
    seo_title: string;
    seo_description: string;
    is_published: boolean;
  }>;
  navigation: Record<string, unknown>;
  footer: Record<string, unknown>;
  seo_defaults: Record<string, string>;
  theme_config: Record<string, unknown>;
  note: string;
  created_by: UUID | null;
  created_by_email: string;
  page_count: number;
  created_at: string;
}

export const templatesApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<{ results: Template[] }>("/templates/", { params }).then((r) => r.data),

  get: (id: UUID) =>
    apiClient.get<Template>(`/templates/${id}/`).then((r) => r.data),

  create: (payload: Partial<Template>) =>
    apiClient.post<Template>("/templates/", payload).then((r) => r.data),

  update: (id: UUID, payload: Partial<Template>) =>
    apiClient.patch<Template>(`/templates/${id}/`, payload).then((r) => r.data),

  delete: (id: UUID) =>
    apiClient.delete(`/templates/${id}/`),

  installed: (storeId: UUID) =>
    apiClient.get<Template | null>("/templates/installed/", { params: { store_id: storeId } }).then((r) => r.data),

  install: (id: UUID, storeId: UUID) =>
    apiClient.post(`/templates/${id}/install/`, { store_id: storeId }).then((r) => r.data),

  preview: (id: UUID) =>
    apiClient.get<Template>(`/templates/${id}/preview/`).then((r) => r.data),

  exportTemplate: (id: UUID) =>
    apiClient.get(`/templates/${id}/export/`).then((r) => r.data),

  importTemplate: (data: Record<string, unknown>) =>
    apiClient.post("/templates/import/", { data }).then((r) => r.data),

  marketplace: (params?: Record<string, string>) =>
    apiClient.get<{ results: Template[] }>("/templates/marketplace/", { params }).then((r) => r.data),

  duplicate: (id: UUID, name: string) =>
    apiClient.post<Template>(`/templates/${id}/duplicate/`, { name }).then((r) => r.data),

  getVersions: (id: UUID) =>
    apiClient.get<TemplateVersion[]>(`/templates/${id}/versions/`).then((r) => r.data),

  getVersion: (id: UUID, versionId: string) =>
    apiClient.get<TemplateVersionDetail>(`/templates/${id}/versions/${versionId}/`).then((r) => r.data),

  rollback: (id: UUID, versionId: string) =>
    apiClient.post<Template>(`/templates/${id}/rollback/`, { version_id: versionId }).then((r) => r.data),

  previewInstall: (id: UUID, storeId: string) =>
    apiClient.get<{ replaced: { pages: number; collections: number; categories: number } }>(
      `/templates/${id}/preview-install/`,
      { params: { store_id: storeId } }
    ).then((r) => r.data),

  createSnapshot: (id: UUID, note: string) =>
    apiClient.post<Template>(`/templates/${id}/snapshot/`, { note }).then((r) => r.data),

  getBackups: () =>
    apiClient.get<StoreBackup[]>("/templates/backups/").then((r) => r.data),

  getBackup: (backupId: UUID) =>
    apiClient.get<StoreBackup>(`/templates/backups/${backupId}/`).then((r) => r.data),

  restoreBackup: (backupId: UUID) =>
    apiClient.post(`/templates/backups/${backupId}/restore/`).then((r) => r.data),
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

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: UUID } & Partial<Template>) =>
      templatesApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["templates", variables.id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: UUID; name: string }) => templatesApi.duplicate(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useTemplateVersions(id: UUID) {
  return useQuery({
    queryKey: ["templates", id, "versions"],
    queryFn: () => templatesApi.getVersions(id),
    enabled: !!id,
  });
}

export function useTemplateVersionDetail(templateId: UUID, versionId: string) {
  return useQuery({
    queryKey: ["templates", templateId, "versions", versionId],
    queryFn: () => templatesApi.getVersion(templateId, versionId),
    enabled: !!templateId && !!versionId,
  });
}

export function useRollbackTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, versionId }: { templateId: UUID; versionId: string }) =>
      templatesApi.rollback(templateId, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["templates", variables.templateId] });
      queryClient.invalidateQueries({ queryKey: ["templates", variables.templateId, "versions"] });
    },
  });
}

export function usePreviewInstall() {
  return useMutation({
    mutationFn: ({ templateId, storeId }: { templateId: UUID; storeId: string }) =>
      templatesApi.previewInstall(templateId, storeId),
  });
}

export function useCreateTemplateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, note }: { templateId: UUID; note: string }) =>
      templatesApi.createSnapshot(templateId, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["templates", variables.templateId, "versions"] });
    },
  });
}

export function useExportTemplate() {
  return useMutation({
    mutationFn: (id: UUID) => templatesApi.exportTemplate(id),
  });
}

export function useImportTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => templatesApi.importTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useTemplateBackups() {
  return useQuery({
    queryKey: ["templates", "backups"],
    queryFn: () => templatesApi.getBackups(),
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (backupId: UUID) => templatesApi.restoreBackup(backupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["templates", "backups"] });
    },
  });
}
