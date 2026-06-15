import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { MediaAsset, MediaFolder, MediaStats } from "@/shared/types";

export const mediaApi = {
  getAssets: async (params?: { store?: string; folder?: string; file_type?: string; search?: string }): Promise<MediaAsset[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.folder) searchParams.set("folder", params.folder);
    if (params?.file_type) searchParams.set("file_type", params.file_type);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/media/assets/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },

  getAsset: async (id: string): Promise<MediaAsset> => {
    const { data } = await apiClient.get(`/media/assets/${id}/`);
    return data;
  },

  upload: async (file: File, folder?: string, title?: string, altText?: string, store?: string): Promise<MediaAsset> => {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) formData.append("folder", folder);
    if (title) formData.append("title", title);
    if (altText) formData.append("alt_text", altText);
    if (store) formData.append("store", store);
    const { data } = await apiClient.post("/media/assets/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteAsset: async (id: string) => {
    await apiClient.delete(`/media/assets/${id}/`);
  },

  moveAsset: async (id: string, folder: string | null): Promise<MediaAsset> => {
    const { data } = await apiClient.post(`/media/assets/${id}/move/`, { folder });
    return data;
  },

  getStats: async (): Promise<MediaStats> => {
    const { data } = await apiClient.get("/media/assets/stats/");
    return data;
  },

  getFolders: async (params?: { store?: string; parent?: string }): Promise<MediaFolder[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.parent) searchParams.set("parent", params.parent);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/media/folders/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },

  createFolder: async (payload: { name: string; parent?: string; store?: string }): Promise<MediaFolder> => {
    const { data } = await apiClient.post("/media/folders/", payload);
    return data;
  },

  deleteFolder: async (id: string) => {
    await apiClient.delete(`/media/folders/${id}/`);
  },
};

export function useMediaAssets(params?: { store?: string; folder?: string; file_type?: string; search?: string }) {
  return useQuery({
    queryKey: ["media", "assets", params],
    queryFn: () => mediaApi.getAssets(params),
  });
}

export function useMediaStats() {
  return useQuery({
    queryKey: ["media", "stats"],
    queryFn: mediaApi.getStats,
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, folder, title, altText, store }: { file: File; folder?: string; title?: string; altText?: string; store?: string }) =>
      mediaApi.upload(file, folder, title, altText, store),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mediaApi.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useMediaFolders(params?: { store?: string; parent?: string }) {
  return useQuery({
    queryKey: ["media", "folders", params],
    queryFn: () => mediaApi.getFolders(params),
  });
}

export function useCreateMediaFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mediaApi.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", "folders"] });
    },
  });
}
