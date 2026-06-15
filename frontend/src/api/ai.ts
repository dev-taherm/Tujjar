import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { AIProvider, AIConversation, AIGenerationLog, AIGenerateResult, AIProductGenerateResult } from "@/shared/types";

export const aiApi = {
  getProviders: async (): Promise<AIProvider[]> => {
    const { data } = await apiClient.get("/ai/providers/");
    return unwrapResults(data);
  },

  createProvider: async (payload: Partial<AIProvider>): Promise<AIProvider> => {
    const { data } = await apiClient.post("/ai/providers/", payload);
    return data;
  },

  updateProvider: async (id: string, payload: Partial<AIProvider>): Promise<AIProvider> => {
    const { data } = await apiClient.patch(`/ai/providers/${id}/`, payload);
    return data;
  },

  deleteProvider: async (id: string) => {
    await apiClient.delete(`/ai/providers/${id}/`);
  },

  getConversations: async (): Promise<AIConversation[]> => {
    const { data } = await apiClient.get("/ai/conversations/");
    return unwrapResults(data);
  },

  getConversation: async (id: string): Promise<AIConversation> => {
    const { data } = await apiClient.get(`/ai/conversations/${id}/`);
    return data;
  },

  createConversation: async (payload: { title?: string; context_type?: string; store?: string }): Promise<AIConversation> => {
    const { data } = await apiClient.post("/ai/conversations/", payload);
    return data;
  },

  sendMessage: async (conversationId: string, message: string): Promise<{ content: string; tokens_used: number; latency_ms: number }> => {
    const { data } = await apiClient.post(`/ai/conversations/${conversationId}/send_message/`, { message });
    return data;
  },

  generateContent: async (payload: { task_type: string; prompt: string; context?: Record<string, unknown>; tone?: string }): Promise<AIGenerateResult> => {
    const { data } = await apiClient.post("/ai/generate_content/", payload);
    return data;
  },

  generateProductContent: async (payload: { title: string; product_type?: string; price?: number; category?: string; tone?: string }): Promise<AIProductGenerateResult> => {
    const { data } = await apiClient.post("/ai/generate-product/", payload);
    return data;
  },

  getGenerationLogs: async (): Promise<AIGenerationLog[]> => {
    const { data } = await apiClient.get("/ai/logs/");
    return data;
  },
};

export function useAIProviders() {
  return useQuery({
    queryKey: ["ai", "providers"],
    queryFn: aiApi.getProviders,
  });
}

export function useCreateAIProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiApi.createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "providers"] });
    },
  });
}

export function useDeleteAIProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiApi.deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "providers"] });
    },
  });
}

export function useAIConversations() {
  return useQuery({
    queryKey: ["ai", "conversations"],
    queryFn: aiApi.getConversations,
  });
}

export function useAIConversation(id: string) {
  return useQuery({
    queryKey: ["ai", "conversations", id],
    queryFn: () => aiApi.getConversation(id),
    enabled: !!id,
  });
}

export function useCreateAIConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiApi.createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] });
    },
  });
}

export function useSendAIMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      aiApi.sendMessage(conversationId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "conversations", variables.conversationId] });
    },
  });
}

export function useGenerateAIContent() {
  return useMutation({
    mutationFn: aiApi.generateContent,
  });
}

export function useGenerateAIProductContent() {
  return useMutation({
    mutationFn: aiApi.generateProductContent,
  });
}
