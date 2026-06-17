import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type {
  BlogAuthor,
  BlogCategory,
  BlogComment,
  BlogListParams,
  BlogPost,
  BlogPostListItem,
  BlogPostStats,
  BlogSubscriber,
  BlogTag,
} from "@/shared/types/blog";

export const blogCategoriesApi = {
  list: async (storeId?: string): Promise<BlogCategory[]> => {
    const params = storeId ? `?store=${storeId}` : "";
    const { data } = await apiClient.get(`/blog/categories/${params}`);
    return unwrapResults(data);
  },

  get: async (id: string): Promise<BlogCategory> => {
    const { data } = await apiClient.get(`/blog/categories/${id}/`);
    return data;
  },

  create: async (payload: {
    store: string;
    name: string;
    slug: string;
    description?: string;
    order?: number;
  }): Promise<BlogCategory> => {
    const { data } = await apiClient.post("/blog/categories/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<BlogCategory>): Promise<BlogCategory> => {
    const { data } = await apiClient.patch(`/blog/categories/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/blog/categories/${id}/`);
  },
};

export const blogTagsApi = {
  list: async (storeId?: string): Promise<BlogTag[]> => {
    const params = storeId ? `?store=${storeId}` : "";
    const { data } = await apiClient.get(`/blog/tags/${params}`);
    return unwrapResults(data);
  },

  get: async (id: string): Promise<BlogTag> => {
    const { data } = await apiClient.get(`/blog/tags/${id}/`);
    return data;
  },

  create: async (payload: {
    store: string;
    name: string;
    slug: string;
    description?: string;
  }): Promise<BlogTag> => {
    const { data } = await apiClient.post("/blog/tags/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<BlogTag>): Promise<BlogTag> => {
    const { data } = await apiClient.patch(`/blog/tags/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/blog/tags/${id}/`);
  },
};

export const blogAuthorsApi = {
  list: async (storeId?: string): Promise<BlogAuthor[]> => {
    const params = storeId ? `?store=${storeId}` : "";
    const { data } = await apiClient.get(`/blog/authors/${params}`);
    return unwrapResults(data);
  },

  get: async (id: string): Promise<BlogAuthor> => {
    const { data } = await apiClient.get(`/blog/authors/${id}/`);
    return data;
  },

  create: async (payload: {
    store: string;
    name: string;
    slug: string;
    bio?: string;
    user?: string;
  }): Promise<BlogAuthor> => {
    const { data } = await apiClient.post("/blog/authors/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<BlogAuthor>): Promise<BlogAuthor> => {
    const { data } = await apiClient.patch(`/blog/authors/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/blog/authors/${id}/`);
  },
};

export const blogPostsApi = {
  list: async (params?: BlogListParams): Promise<BlogPostListItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    const { data } = await apiClient.get(`/blog/posts/${query ? `?${query}` : ""}`);
    return unwrapResults(data);
  },

  get: async (id: string): Promise<BlogPost> => {
    const { data } = await apiClient.get(`/blog/posts/${id}/`);
    return data;
  },

  create: async (payload: {
    store: string;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    author?: string;
    categories?: string[];
    tags?: string[];
    featured_image?: string | null;
    featured_image_alt?: string;
    status?: string;
    seo_title?: string;
    seo_description?: string;
  }): Promise<BlogPost> => {
    const { data } = await apiClient.post("/blog/posts/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<BlogPost>): Promise<BlogPost> => {
    const { data } = await apiClient.patch(`/blog/posts/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/blog/posts/${id}/`);
  },

  publish: async (id: string): Promise<BlogPost> => {
    const { data } = await apiClient.post(`/blog/posts/${id}/publish/`);
    return data;
  },

  unpublish: async (id: string): Promise<BlogPost> => {
    const { data } = await apiClient.post(`/blog/posts/${id}/unpublish/`);
    return data;
  },

  archive: async (id: string): Promise<BlogPost> => {
    const { data } = await apiClient.post(`/blog/posts/${id}/archive/`);
    return data;
  },

  schedule: async (id: string, scheduledAt: string): Promise<BlogPost> => {
    const { data } = await apiClient.post(`/blog/posts/${id}/schedule/`, {
      scheduled_at: scheduledAt,
    });
    return data;
  },

  setFeatured: async (id: string): Promise<{ is_featured: boolean }> => {
    const { data } = await apiClient.post(`/blog/posts/${id}/set-featured/`);
    return data;
  },

  getStats: async (id: string): Promise<BlogPostStats> => {
    const { data } = await apiClient.get(`/blog/posts/${id}/stats/`);
    return data;
  },

  autoSave: async (id: string, payload: {
    title?: string;
    content?: string;
  }): Promise<{ saved: boolean; updated_at: string }> => {
    const { data } = await apiClient.post(`/blog/posts/${id}/auto-save/`, payload);
    return data;
  },

  aiGenerate: async (payload: {
    task_type: string;
    prompt: string;
    context?: Record<string, unknown>;
    tone?: string;
  }): Promise<{ content: string; tokens_used: number; is_success: boolean }> => {
    const { data } = await apiClient.post("/blog/posts/ai/generate/", payload);
    return data;
  },

  aiImprove: async (id: string, type: string): Promise<{
    content: string;
    improvement_type: string;
    tokens_used: number;
  }> => {
    const { data } = await apiClient.post(`/blog/posts/${id}/ai/improve/`, { type });
    return data;
  },
};

export const blogCommentsApi = {
  list: async (params?: {
    store?: string;
    post?: string;
    status?: string;
  }): Promise<BlogComment[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.post) searchParams.set("post", params.post);
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    const { data } = await apiClient.get(`/blog/comments/${query ? `?${query}` : ""}`);
    return unwrapResults(data);
  },

  approve: async (id: string): Promise<BlogComment> => {
    const { data } = await apiClient.post(`/blog/comments/${id}/approve/`);
    return data;
  },

  reject: async (id: string): Promise<BlogComment> => {
    const { data } = await apiClient.post(`/blog/comments/${id}/reject/`);
    return data;
  },

  trash: async (id: string): Promise<BlogComment> => {
    const { data } = await apiClient.post(`/blog/comments/${id}/trash/`);
    return data;
  },

  approveAll: async (storeId: string): Promise<{ approved: number }> => {
    const { data } = await apiClient.post("/blog/comments/approve-all/", {
      store: storeId,
    });
    return data;
  },
};

export const blogSubscribersApi = {
  list: async (storeId?: string): Promise<BlogSubscriber[]> => {
    const params = storeId ? `?store=${storeId}` : "";
    const { data } = await apiClient.get(`/blog/subscribers/${params}`);
    return unwrapResults(data);
  },

  unsubscribe: async (id: string): Promise<void> => {
    await apiClient.post(`/blog/subscribers/${id}/unsubscribe/`);
  },

  subscribe: async (storeId: string, email: string): Promise<void> => {
    await apiClient.post(`/blog/posts/0/subscribe/`, {
      store: storeId,
      email,
    });
  },
};

export function useBlogCategories(storeId?: string) {
  return useQuery({
    queryKey: ["blog-categories", storeId],
    queryFn: () => blogCategoriesApi.list(storeId),
    enabled: !!storeId,
  });
}

export function useBlogCategory(id: string) {
  return useQuery({
    queryKey: ["blog-categories", id],
    queryFn: () => blogCategoriesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogCategoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
    },
  });
}

export function useUpdateBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<BlogCategory>) =>
      blogCategoriesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
    },
  });
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogCategoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
    },
  });
}

export function useBlogTags(storeId?: string) {
  return useQuery({
    queryKey: ["blog-tags", storeId],
    queryFn: () => blogTagsApi.list(storeId),
    enabled: !!storeId,
  });
}

export function useCreateBlogTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogTagsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
    },
  });
}

export function useUpdateBlogTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<BlogTag>) =>
      blogTagsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
    },
  });
}

export function useDeleteBlogTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogTagsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
    },
  });
}

export function useBlogAuthors(storeId?: string) {
  return useQuery({
    queryKey: ["blog-authors", storeId],
    queryFn: () => blogAuthorsApi.list(storeId),
    enabled: !!storeId,
  });
}

export function useCreateBlogAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogAuthorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-authors"] });
    },
  });
}

export function useUpdateBlogAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<BlogAuthor>) =>
      blogAuthorsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-authors"] });
    },
  });
}

export function useDeleteBlogAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogAuthorsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-authors"] });
    },
  });
}

export function useBlogPosts(params?: BlogListParams) {
  return useQuery({
    queryKey: ["blog-posts", params],
    queryFn: () => blogPostsApi.list(params),
  });
}

export function useBlogPost(id: string) {
  return useQuery({
    queryKey: ["blog-posts", id],
    queryFn: () => blogPostsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogPostsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<BlogPost>) =>
      blogPostsApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts", variables.id] });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogPostsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

export function usePublishBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogPostsApi.publish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

export function useUnpublishBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogPostsApi.unpublish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

export function useArchiveBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogPostsApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

export function useScheduleBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      blogPostsApi.schedule(id, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

export function useSetBlogPostFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogPostsApi.setFeatured,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

export function useBlogPostStats(id: string) {
  return useQuery({
    queryKey: ["blog-posts", id, "stats"],
    queryFn: () => blogPostsApi.getStats(id),
    enabled: !!id,
  });
}

export function useAutoSaveBlogPost() {
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; title?: string; content?: string }) =>
      blogPostsApi.autoSave(id, payload),
  });
}

export function useAIGenerateBlogPost() {
  return useMutation({
    mutationFn: blogPostsApi.aiGenerate,
  });
}

export function useAIImproveBlogPost() {
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) =>
      blogPostsApi.aiImprove(id, type),
  });
}

export function useBlogComments(params?: {
  store?: string;
  post?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["blog-comments", params],
    queryFn: () => blogCommentsApi.list(params),
  });
}

export function useApproveBlogComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogCommentsApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
    },
  });
}

export function useRejectBlogComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogCommentsApi.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
    },
  });
}

export function useTrashBlogComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogCommentsApi.trash,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
    },
  });
}

export function useApproveAllBlogComments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogCommentsApi.approveAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
    },
  });
}

export function useBlogSubscribers(storeId?: string) {
  return useQuery({
    queryKey: ["blog-subscribers", storeId],
    queryFn: () => blogSubscribersApi.list(storeId),
    enabled: !!storeId,
  });
}

export function useUnsubscribeBlogSubscriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blogSubscribersApi.unsubscribe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-subscribers"] });
    },
  });
}

export function useBlogSubscribe() {
  return useMutation({
    mutationFn: ({ storeId, email }: { storeId: string; email: string }) =>
      blogSubscribersApi.subscribe(storeId, email),
  });
}
