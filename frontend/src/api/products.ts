import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { Product, Category, Collection, ProductImage, ProductVariant, ProductOption, ProductOptionValue, InventoryMovement } from "@/shared/types";

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
    return unwrapResults(data);
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
    return unwrapResults(data);
  },

  addImage: async (productId: string, payload: { url: string; alt_text?: string; is_primary?: boolean; media_asset?: string }): Promise<ProductImage> => {
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

  reorderImages: async (productId: string, imagePositions: { id: string; position: number }[]): Promise<void> => {
    await Promise.all(
      imagePositions.map(({ id, position }) =>
        apiClient.patch(`/products/${productId}/images/${id}/`, { position })
      )
    );
  },

  listOptions: async (productId: string): Promise<ProductOption[]> => {
    const { data } = await apiClient.get(`/products/${productId}/options/`);
    return unwrapResults(data);
  },

  createOption: async (productId: string, payload: { name: string; position: number }): Promise<ProductOption> => {
    const { data } = await apiClient.post(`/products/${productId}/options/`, payload);
    return data;
  },

  updateOption: async (productId: string, optionId: string, payload: Partial<ProductOption>): Promise<ProductOption> => {
    const { data } = await apiClient.patch(`/products/${productId}/options/${optionId}/`, payload);
    return data;
  },

  deleteOption: async (productId: string, optionId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/options/${optionId}/`);
  },

  addOptionValue: async (productId: string, optionId: string, payload: { value: string; swatch?: string }): Promise<ProductOptionValue> => {
    const { data } = await apiClient.post(`/products/${productId}/options/${optionId}/values/`, payload);
    return data;
  },

  deleteOptionValue: async (productId: string, optionId: string, valueId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/options/${optionId}/values/${valueId}/`);
  },

  variantInventoryUpdate: async (productId: string, variantId: string, adjustment: number, reason?: string): Promise<ProductVariant> => {
    const { data } = await apiClient.post(`/products/${productId}/variants/${variantId}/inventory/update/`, { adjustment, reason });
    return data;
  },
};

export const categoriesApi = {
  list: async (params?: { store?: string; parent?: string }): Promise<Category[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.parent !== undefined) searchParams.set("parent", params.parent);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/products/categories/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },

  get: async (id: string): Promise<Category> => {
    const { data } = await apiClient.get(`/products/categories/${id}/`);
    return data;
  },

  create: async (payload: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.post("/products/categories/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.patch(`/products/categories/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/products/categories/${id}/`);
  },
};

export const collectionsApi = {
  list: async (params?: { store?: string }): Promise<Collection[]> => {
    const qs = params?.store ? `?store=${params.store}` : "";
    const { data } = await apiClient.get(`/products/collections/${qs}`);
    return unwrapResults(data);
  },

  get: async (id: string): Promise<Collection> => {
    const { data } = await apiClient.get(`/products/collections/${id}/`);
    return data;
  },

  create: async (payload: Partial<Collection>): Promise<Collection> => {
    const { data } = await apiClient.post("/products/collections/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Collection>): Promise<Collection> => {
    const { data } = await apiClient.patch(`/products/collections/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/products/collections/${id}/`);
  },
};

export const inventoryMovementsApi = {
  list: async (params?: { product?: string; variant?: string; reason?: string }): Promise<InventoryMovement[]> => {
    const searchParams = new URLSearchParams();
    if (params?.product) searchParams.set("product", params.product);
    if (params?.variant) searchParams.set("variant", params.variant);
    if (params?.reason) searchParams.set("reason", params.reason);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/products/inventory-movements/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },
};

export const optionsApi = {
  list: async (): Promise<ProductOption[]> => {
    const { data } = await apiClient.get("/products/options/");
    return unwrapResults(data);
  },

  create: async (payload: { product: string; name: string; position: number }): Promise<ProductOption> => {
    const { data } = await apiClient.post("/products/options/", payload);
    return data;
  },

  delete: async (optionId: string): Promise<void> => {
    await apiClient.delete(`/products/options/${optionId}/`);
  },

  addValue: async (optionId: string, payload: { value: string; swatch?: string }): Promise<ProductOptionValue> => {
    const { data } = await apiClient.post(`/products/options/${optionId}/values/`, payload);
    return data;
  },

  deleteValue: async (optionId: string, valueId: string): Promise<void> => {
    await apiClient.delete(`/products/options/${optionId}/values/${valueId}/`);
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

export function useProductOptions(productId: string) {
  return useQuery({
    queryKey: ["product-options", productId],
    queryFn: () => productsApi.listOptions(productId),
    enabled: !!productId,
  });
}

export function useCreateProductOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ...payload }: { productId: string; name: string; position: number }) =>
      productsApi.createOption(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-options", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
    },
  });
}

export function useDeleteProductOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, optionId }: { productId: string; optionId: string }) =>
      productsApi.deleteOption(productId, optionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-options", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
    },
  });
}

export function useAddOptionValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, optionId, ...payload }: { productId: string; optionId: string; value: string; swatch?: string }) =>
      productsApi.addOptionValue(productId, optionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-options", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
    },
  });
}

export function useDeleteOptionValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, optionId, valueId }: { productId: string; optionId: string; valueId: string }) =>
      productsApi.deleteOptionValue(productId, optionId, valueId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-options", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
    },
  });
}

export function useAddProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ...payload }: { productId: string; url: string; alt_text?: string; is_primary?: boolean; media_asset?: string }) =>
      productsApi.addImage(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      productsApi.deleteImage(productId, imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
    },
  });
}

export function useSetPrimaryProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      productsApi.setPrimaryImage(productId, imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
    },
  });
}

export function useInventoryMovements(params?: { product?: string; variant?: string; reason?: string }) {
  return useQuery({
    queryKey: ["inventory-movements", params],
    queryFn: () => inventoryMovementsApi.list(params),
  });
}

export function useVariantInventoryUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId, adjustment, reason }: { productId: string; variantId: string; adjustment: number; reason?: string }) =>
      productsApi.variantInventoryUpdate(productId, variantId, adjustment, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useGlobalOptions() {
  return useQuery({
    queryKey: ["global-options"],
    queryFn: () => optionsApi.list(),
  });
}

export function useCreateGlobalOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: optionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-options"] });
    },
  });
}

export function useDeleteGlobalOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: optionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-options"] });
    },
  });
}

export function useAddGlobalOptionValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ optionId, ...payload }: { optionId: string; value: string; swatch?: string }) =>
      optionsApi.addValue(optionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-options"] });
    },
  });
}

export function useDeleteGlobalOptionValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ optionId, valueId }: { optionId: string; valueId: string }) =>
      optionsApi.deleteValue(optionId, valueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-options"] });
    },
  });
}
