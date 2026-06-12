import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Product, Category, Collection, ProductImage, ProductVariant } from "@/shared/types";

export const productsApi = {
  list: async (params?: { store?: string; status?: string; search?: string; category?: string; collection?: string }): Promise<Product[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.collection) searchParams.set("collection", params.collection);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/products/${qs ? `?${qs}` : ""}`);
    return data.results || data;
  },

  get: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get(`/products/${id}/`);
    return data;
  },

  create: async (payload: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.post("/products/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.patch(`/products/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/products/${id}/`);
  },

  duplicate: async (id: string): Promise<Product> => {
    const { data } = await apiClient.post(`/products/${id}/duplicate/`);
    return data;
  },

  updateInventory: async (id: string, adjustment: number): Promise<Product> => {
    const { data } = await apiClient.post(`/products/${id}/inventory/update/`, { adjustment });
    return data;
  },

  lowStock: async (): Promise<Product[]> => {
    const { data } = await apiClient.get("/products/low-stock/");
    return data.results || data;
  },

  addImage: async (productId: string, payload: { url: string; alt_text?: string; is_primary?: boolean }): Promise<ProductImage> => {
    const { data } = await apiClient.post(`/products/${productId}/images/`, payload);
    return data;
  },

  deleteImage: async (productId: string, imageId: string) => {
    await apiClient.delete(`/products/${productId}/images/${imageId}/`);
  },

  setPrimaryImage: async (productId: string, imageId: string): Promise<ProductImage> => {
    const { data } = await apiClient.post(`/products/${productId}/images/${imageId}/set-primary/`);
    return data;
  },

  addVariant: async (productId: string, payload: Partial<ProductVariant>): Promise<ProductVariant> => {
    const { data } = await apiClient.post(`/products/${productId}/variants/`, payload);
    return data;
  },

  updateVariant: async (productId: string, variantId: string, payload: Partial<ProductVariant>): Promise<ProductVariant> => {
    const { data } = await apiClient.patch(`/products/${productId}/variants/${variantId}/`, payload);
    return data;
  },

  deleteVariant: async (productId: string, variantId: string) => {
    await apiClient.delete(`/products/${productId}/variants/${variantId}/`);
  },
};

export const categoriesApi = {
  list: async (params?: { store?: string; parent?: string }): Promise<Category[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.parent !== undefined) searchParams.set("parent", params.parent);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/categories/${qs ? `?${qs}` : ""}`);
    return data.results || data;
  },

  get: async (id: string): Promise<Category> => {
    const { data } = await apiClient.get(`/categories/${id}/`);
    return data;
  },

  create: async (payload: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.post("/categories/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.patch(`/categories/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/categories/${id}/`);
  },
};

export const collectionsApi = {
  list: async (params?: { store?: string }): Promise<Collection[]> => {
    const qs = params?.store ? `?store=${params.store}` : "";
    const { data } = await apiClient.get(`/collections/${qs}`);
    return data.results || data;
  },

  get: async (id: string): Promise<Collection> => {
    const { data } = await apiClient.get(`/collections/${id}/`);
    return data;
  },

  create: async (payload: Partial<Collection>): Promise<Collection> => {
    const { data } = await apiClient.post("/collections/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Collection>): Promise<Collection> => {
    const { data } = await apiClient.patch(`/collections/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/collections/${id}/`);
  },
};

export function useProducts(params?: { store?: string; status?: string; search?: string; category?: string; collection?: string }) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.list(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Product>) =>
      productsApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDuplicateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adjustment }: { id: string; adjustment: number }) =>
      productsApi.updateInventory(id, adjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCategories(params?: { store?: string; parent?: string }) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoriesApi.list(params),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: () => categoriesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Category>) =>
      categoriesApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", variables.id] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useCollections(params?: { store?: string }) {
  return useQuery({
    queryKey: ["collections", params],
    queryFn: () => collectionsApi.list(params),
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: ["collections", id],
    queryFn: () => collectionsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Collection>) =>
      collectionsApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", variables.id] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
