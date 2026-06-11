import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, setTokens, clearTokens } from "./client";
import type { AuthTokens, User, Organization, Store, Theme, StoreDomain, ThemePreset, Page, PageVersion, SectionDefinition, Product, Category, Collection, ProductImage, ProductVariant, Order, Cart, Customer, AIProvider, AIConversation, AIGenerationLog, AIGenerateResult, AIProductGenerateResult, MediaAsset, MediaFolder, MediaStats, DashboardSummary, RealtimeStats, SearchResult, SearchQueryLog, Notification, NotificationPreference, Plan, Subscription, Invoice, PaymentMethod, MarketplaceListing, MarketplaceReview } from "@/shared/types";

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
    const { data } = await apiClient.post("/auth/login/", { email, password });
    const tokens = data.tokens || { access: data.access, refresh: data.refresh };
    setTokens(tokens.access, tokens.refresh);
    return { user: data.user, tokens };
  },

  register: async (payload: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
  }): Promise<{ user: User; tokens: AuthTokens }> => {
    const { data } = await apiClient.post("/auth/register/", payload);
    const tokens = data.tokens || { access: data.access, refresh: data.refresh };
    setTokens(tokens.access, tokens.refresh);
    return { user: data.user, tokens };
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    await apiClient.post("/auth/logout/", { refresh: refreshToken });
    clearTokens();
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get("/auth/users/me/");
    return data;
  },

  updateMe: async (payload: Partial<User>): Promise<User> => {
    const { data } = await apiClient.patch("/auth/users/me/", payload);
    return data;
  },

  verifyEmail: async (token: string) => {
    const { data } = await apiClient.post("/auth/verify-email/", { token });
    return data;
  },

  requestPasswordReset: async (email: string) => {
    const { data } = await apiClient.post("/auth/password-reset/request/", { email });
    return data;
  },

  resetPassword: async (token: string, password: string, passwordConfirm: string) => {
    const { data } = await apiClient.post("/auth/password-reset/confirm/", {
      token,
      password,
      password_confirm: passwordConfirm,
    });
    return data;
  },
};

// Organizations API
export const organizationsApi = {
  list: async (): Promise<Organization[]> => {
    const { data } = await apiClient.get("/organizations/");
    return data.results || data;
  },

  get: async (id: string): Promise<Organization> => {
    const { data } = await apiClient.get(`/organizations/${id}/`);
    return data;
  },

  create: async (payload: { name: string; slug: string }): Promise<Organization> => {
    const { data } = await apiClient.post("/organizations/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Organization>): Promise<Organization> => {
    const { data } = await apiClient.patch(`/organizations/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/organizations/${id}/`);
  },

  getMembers: async (orgId: string) => {
    const { data } = await apiClient.get(`/organizations/${orgId}/members/`);
    return data;
  },

  inviteMember: async (orgId: string, email: string, roleSlug: string) => {
    const { data } = await apiClient.post(`/organizations/${orgId}/invite/`, {
      email,
      role_slug: roleSlug,
    });
    return data;
  },
};

// Stores API
export const storesApi = {
  list: async (): Promise<Store[]> => {
    const { data } = await apiClient.get("/stores/");
    return data.results || data;
  },

  get: async (id: string): Promise<Store> => {
    const { data } = await apiClient.get(`/stores/${id}/`);
    return data;
  },

  create: async (payload: { name: string; slug: string; description?: string }): Promise<Store> => {
    const { data } = await apiClient.post("/stores/", payload);
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
    return data.results || data;
  },

  addDomain: async (storeId: string, domain: string): Promise<StoreDomain> => {
    const { data } = await apiClient.post(`/stores/${storeId}/domains/`, { domain });
    return data;
  },

  removeDomain: async (storeId: string, domainId: string) => {
    await apiClient.delete(`/stores/${storeId}/domains/${domainId}/`);
  },
};

// Themes API
export const themesApi = {
  list: async (): Promise<Theme[]> => {
    const { data } = await apiClient.get("/themes/");
    return data.results || data;
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

  install: async (id: string): Promise<Theme> => {
    const { data } = await apiClient.post(`/themes/${id}/install/`);
    return data;
  },

  duplicate: async (id: string, name: string): Promise<Theme> => {
    const { data } = await apiClient.post(`/themes/${id}/duplicate/`, { name });
    return data;
  },

  exportTheme: async (id: string) => {
    const { data } = await apiClient.get(`/themes/${id}/export/`);
    return data;
  },

  marketplace: async (): Promise<Theme[]> => {
    const { data } = await apiClient.get("/themes/marketplace/");
    return data.results || data;
  },

  getPresets: async (themeId: string): Promise<ThemePreset[]> => {
    const { data } = await apiClient.get(`/themes/${themeId}/presets/`);
    return data.results || data;
  },

  createPreset: async (themeId: string, payload: { name: string; config: Record<string, unknown> }): Promise<ThemePreset> => {
    const { data } = await apiClient.post(`/themes/${themeId}/presets/`, payload);
    return data;
  },
};

// React Query hooks
export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: authApi.getMe,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: organizationsApi.list,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: organizationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

// Store hooks
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

// Theme hooks
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
    mutationFn: themesApi.install,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    },
  });
}

export function useThemeMarketplace() {
  return useQuery({
    queryKey: ["themes", "marketplace"],
    queryFn: themesApi.marketplace,
  });
}

// Pages API
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

// Page hooks
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

// Products API
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

// Categories API
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

// Collections API
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

// Product hooks
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

// Category hooks
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

// Collection hooks
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

// Orders API
export const ordersApi = {
  list: async (params?: { store?: string; status?: string; search?: string }): Promise<Order[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/orders/${qs ? `?${qs}` : ""}`);
    return data.results || data;
  },

  get: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get(`/orders/${id}/`);
    return data;
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/update_status/`, { status });
    return data;
  },

  updatePaymentStatus: async (id: string, payment_status: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/update_payment_status/`, { payment_status });
    return data;
  },

  ship: async (id: string, tracking_number?: string, tracking_url?: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/ship/`, { tracking_number, tracking_url });
    return data;
  },

  deliver: async (id: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/deliver/`);
    return data;
  },

  cancel: async (id: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/cancel/`);
    return data;
  },

  addNote: async (id: string, note_type: string, note: string): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/add_note/`, { note_type, note });
    return data;
  },
};

// Carts API
export const cartsApi = {
  list: async (params?: { store?: string; status?: string }): Promise<Cart[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.status) searchParams.set("status", params.status);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/carts/${qs ? `?${qs}` : ""}`);
    return data.results || data;
  },

  get: async (id: string): Promise<Cart> => {
    const { data } = await apiClient.get(`/carts/${id}/`);
    return data;
  },

  addItem: async (id: string, product: string, quantity: number, variant?: string): Promise<Cart> => {
    const payload: Record<string, unknown> = { product, quantity };
    if (variant) payload.variant = variant;
    const { data } = await apiClient.post(`/carts/${id}/items/add/`, payload);
    return data;
  },

  updateItem: async (id: string, item_id: string, quantity: number): Promise<Cart> => {
    const { data } = await apiClient.post(`/carts/${id}/items/update/`, { item_id, quantity });
    return data;
  },

  removeItem: async (id: string, item_id: string): Promise<Cart> => {
    const { data } = await apiClient.post(`/carts/${id}/items/remove/`, { item_id });
    return data;
  },

  checkout: async (id: string, payload: Record<string, unknown>): Promise<Order> => {
    const { data } = await apiClient.post(`/carts/${id}/checkout/`, payload);
    return data;
  },
};

// Customers API
export const customersApi = {
  list: async (params?: { store?: string; search?: string }): Promise<Customer[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/customers/${qs ? `?${qs}` : ""}`);
    return data.results || data;
  },

  get: async (id: string): Promise<Customer> => {
    const { data } = await apiClient.get(`/customers/${id}/`);
    return data;
  },

  create: async (payload: Partial<Customer>): Promise<Customer> => {
    const { data } = await apiClient.post("/customers/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Customer>): Promise<Customer> => {
    const { data } = await apiClient.patch(`/customers/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/customers/${id}/`);
  },
};

// Order hooks
export function useOrders(params?: { store?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersApi.list(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useShipOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tracking_number, tracking_url }: { id: string; tracking_number?: string; tracking_url?: string }) =>
      ordersApi.ship(id, tracking_number, tracking_url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useDeliverOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.deliver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// Cart hooks
export function useCarts(params?: { store?: string; status?: string }) {
  return useQuery({
    queryKey: ["carts", params],
    queryFn: () => cartsApi.list(params),
  });
}

export function useCart(id: string) {
  return useQuery({
    queryKey: ["carts", id],
    queryFn: () => cartsApi.get(id),
    enabled: !!id,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, product, quantity, variant }: { id: string; product: string; quantity: number; variant?: string }) =>
      cartsApi.addItem(id, product, quantity, variant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carts"] });
    },
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; [key: string]: unknown }) =>
      cartsApi.checkout(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carts"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// Customer hooks
export function useCustomers(params?: { store?: string; search?: string }) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customersApi.list(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Customer>) =>
      customersApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

// AI API
export const aiApi = {
  getProviders: async (): Promise<AIProvider[]> => {
    const { data } = await apiClient.get("/ai/providers/");
    return data.results || data;
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
    return data.results || data;
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

// AI hooks
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

// Media API
export const mediaApi = {
  getAssets: async (params?: { store?: string; folder?: string; file_type?: string; search?: string }): Promise<MediaAsset[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.folder) searchParams.set("folder", params.folder);
    if (params?.file_type) searchParams.set("file_type", params.file_type);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/media/assets/${qs ? `?${qs}` : ""}`);
    return data.results || data;
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
    return data.results || data;
  },

  createFolder: async (payload: { name: string; parent?: string; store?: string }): Promise<MediaFolder> => {
    const { data } = await apiClient.post("/media/folders/", payload);
    return data;
  },

  deleteFolder: async (id: string) => {
    await apiClient.delete(`/media/folders/${id}/`);
  },
};

// Media hooks
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

// Analytics API
export const analyticsApi = {
  trackEvent: async (event: { event_type: string; entity_type?: string; entity_id?: string; metadata?: Record<string, unknown>; session_id?: string; url?: string; referrer?: string }) => {
    const { data } = await apiClient.post("/analytics/events/", event);
    return data;
  },

  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await apiClient.get("/analytics/events/summary/");
    return data;
  },

  getRevenueChart: async (period: "day" | "week" | "month" = "day") => {
    const { data } = await apiClient.get(`/analytics/events/revenue_chart/?period=${period}`);
    return data;
  },

  getRealtime: async (): Promise<RealtimeStats> => {
    const { data } = await apiClient.get("/analytics/events/realtime/");
    return data;
  },
};

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: analyticsApi.getSummary,
  });
}

export function useRealtimeStats() {
  return useQuery({
    queryKey: ["analytics", "realtime"],
    queryFn: analyticsApi.getRealtime,
    refetchInterval: 30000,
  });
}

export function useTrackEvent() {
  return useMutation({
    mutationFn: analyticsApi.trackEvent,
  });
}

// Search API
export const searchApi = {
  search: async (q: string, entityTypes?: string[], limit = 20): Promise<{ results: SearchResult[]; query: string }> => {
    const { data } = await apiClient.post("/search/index/search/", { q, entity_types: entityTypes, limit });
    return data;
  },

  getSuggestions: async (q: string): Promise<{ suggestions: string[] }> => {
    const { data } = await apiClient.get(`/search/index/search_suggestions/?q=${encodeURIComponent(q)}`);
    return data;
  },

  getSearchQueries: async (params?: { store?: string }): Promise<SearchQueryLog[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/search/queries/${qs ? `?${qs}` : ""}`);
    return data.results || data;
  },
};

export function useSearch(query: string, entityTypes?: string[]) {
  return useQuery({
    queryKey: ["search", query, entityTypes],
    queryFn: () => searchApi.search(query, entityTypes),
    enabled: query.length >= 2,
  });
}

export function useSearchSuggestions(q: string) {
  return useQuery({
    queryKey: ["search", "suggestions", q],
    queryFn: () => searchApi.getSuggestions(q),
    enabled: q.length >= 2,
  });
}

// Notifications API
export const notificationsApi = {
  getNotifications: async (params?: { is_read?: boolean }): Promise<Notification[]> => {
    const searchParams = new URLSearchParams();
    if (params?.is_read !== undefined) searchParams.set("is_read", String(params.is_read));
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/notifications/notifications/${qs ? `?${qs}` : ""}`);
    return data.results || data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const { data } = await apiClient.get("/notifications/notifications/unread_count/");
    return data;
  },

  markRead: async (id: string) => {
    const { data } = await apiClient.post(`/notifications/notifications/${id}/mark_read/`);
    return data;
  },

  markAllRead: async () => {
    const { data } = await apiClient.post("/notifications/notifications/mark_all_read/");
    return data;
  },

  getPreferences: async (): Promise<NotificationPreference> => {
    const { data } = await apiClient.get("/notifications/preferences/");
    return data;
  },

  updatePreferences: async (prefs: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const { data } = await apiClient.put("/notifications/preferences/", prefs);
    return data;
  },
};

export function useNotifications(params?: { is_read?: boolean }) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationsApi.getNotifications(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: notificationsApi.getPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
    },
  });
}

// Billing API
export const billingApi = {
  getPlans: async (): Promise<Plan[]> => {
    const { data } = await apiClient.get("/billing/plans/");
    return data.results || data;
  },

  getSubscription: async (): Promise<Subscription | null> => {
    try {
      const { data } = await apiClient.get("/billing/subscription/");
      const results = data.results || data;
      return Array.isArray(results) ? results[0] || null : results;
    } catch {
      return null;
    }
  },

  checkout: async (planSlug: string, successUrl: string, cancelUrl: string) => {
    const { data } = await apiClient.post("/billing/subscription/checkout/", {
      plan_slug: planSlug, success_url: successUrl, cancel_url: cancelUrl,
    });
    return data;
  },

  cancelSubscription: async () => {
    const { data } = await apiClient.post("/billing/subscription/cancel/");
    return data;
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const { data } = await apiClient.get("/billing/invoices/");
    return data.results || data;
  },

  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const { data } = await apiClient.get("/billing/payment-methods/");
    return data.results || data;
  },

  setDefaultPaymentMethod: async (id: string) => {
    const { data } = await apiClient.post(`/billing/payment-methods/${id}/set_default/`);
    return data;
  },
};

export function usePlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: billingApi.getPlans,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: billingApi.getSubscription,
  });
}

export function useBillingCheckout() {
  return useMutation({
    mutationFn: ({ planSlug, successUrl, cancelUrl }: { planSlug: string; successUrl: string; cancelUrl: string }) =>
      billingApi.checkout(planSlug, successUrl, cancelUrl),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: billingApi.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: billingApi.getInvoices,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["billing", "payment-methods"],
    queryFn: billingApi.getPaymentMethods,
  });
}

// Marketplace API
export const marketplaceApi = {
  getListings: async (params?: { category?: string; pricing_type?: string; search?: string; featured?: boolean }): Promise<MarketplaceListing[]> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.pricing_type) searchParams.set("pricing_type", params.pricing_type);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.featured) searchParams.set("featured", "true");
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/marketplace/listings/${qs ? `?${qs}` : ""}`);
    return data.results || data;
  },

  getListing: async (id: string): Promise<MarketplaceListing> => {
    const { data } = await apiClient.get(`/marketplace/listings/${id}/`);
    return data;
  },

  installListing: async (id: string) => {
    const { data } = await apiClient.post(`/marketplace/listings/${id}/install/`);
    return data;
  },

  getCategories: async (): Promise<{ categories: string[] }> => {
    const { data } = await apiClient.get("/marketplace/listings/categories/");
    return data;
  },

  getReviews: async (listingId: string): Promise<MarketplaceReview[]> => {
    const { data } = await apiClient.get(`/marketplace/listings/${listingId}/reviews/`);
    return data;
  },

  createReview: async (listingId: string, review: { rating: number; title: string; body: string }) => {
    const { data } = await apiClient.post(`/marketplace/listings/${listingId}/reviews/`, review);
    return data;
  },
};

export function useMarketplaceListings(params?: { category?: string; pricing_type?: string; search?: string; featured?: boolean }) {
  return useQuery({
    queryKey: ["marketplace", "listings", params],
    queryFn: () => marketplaceApi.getListings(params),
  });
}

export function useMarketplaceCategories() {
  return useQuery({
    queryKey: ["marketplace", "categories"],
    queryFn: marketplaceApi.getCategories,
  });
}

export function useInstallListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketplaceApi.installListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
}
