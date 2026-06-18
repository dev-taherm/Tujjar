import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type {
  Address,
  Customer,
  LoyaltyTransaction,
  Review,
  SavedCart,
  WishlistItem,
} from "@/shared/types";

export const customersApi = {
  list: async (params?: { store?: string; search?: string }): Promise<Customer[]> => {
    const searchParams = new URLSearchParams();
    if (params?.store) searchParams.set("store", params.store);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/customers/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
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

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export const addressesApi = {
  list: async (customerId: string): Promise<Address[]> => {
    const { data } = await apiClient.get(`/customers/addresses/?customer=${customerId}`);
    return unwrapResults(data);
  },

  create: async (payload: Partial<Address>): Promise<Address> => {
    const { data } = await apiClient.post("/customers/addresses/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Address>): Promise<Address> => {
    const { data } = await apiClient.patch(`/customers/addresses/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/customers/addresses/${id}/`);
  },

  setDefault: async (id: string): Promise<Address> => {
    const { data } = await apiClient.post(`/customers/addresses/${id}/set-default/`);
    return data;
  },
};

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

export const wishlistApi = {
  list: async (customerId: string): Promise<WishlistItem[]> => {
    const { data } = await apiClient.get(`/customers/wishlist/?customer=${customerId}`);
    return unwrapResults(data);
  },

  add: async (payload: {
    store: string;
    customer: string;
    product: string;
    note?: string;
  }): Promise<WishlistItem> => {
    const { data } = await apiClient.post("/customers/wishlist/", payload);
    return data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/customers/wishlist/${id}/`);
  },
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewsApi = {
  list: async (params: { customer?: string; product?: string }): Promise<Review[]> => {
    const searchParams = new URLSearchParams();
    if (params.customer) searchParams.set("customer", params.customer);
    if (params.product) searchParams.set("product", params.product);
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/customers/reviews/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
  },

  create: async (payload: Partial<Review>): Promise<Review> => {
    const { data } = await apiClient.post("/customers/reviews/", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Review>): Promise<Review> => {
    const { data } = await apiClient.patch(`/customers/reviews/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/customers/reviews/${id}/`);
  },

  approve: async (id: string): Promise<Review> => {
    const { data } = await apiClient.post(`/customers/reviews/${id}/approve/`);
    return data;
  },

  reject: async (id: string): Promise<Review> => {
    const { data } = await apiClient.post(`/customers/reviews/${id}/reject/`);
    return data;
  },

  productReviews: async (productId: string): Promise<Review[]> => {
    const { data } = await apiClient.get(
      `/customers/reviews/product-reviews/?product=${productId}`,
    );
    return data;
  },
};

// ---------------------------------------------------------------------------
// Loyalty
// ---------------------------------------------------------------------------

export const loyaltyApi = {
  list: async (customerId: string): Promise<LoyaltyTransaction[]> => {
    const { data } = await apiClient.get(
      `/customers/loyalty-transactions/?customer=${customerId}`,
    );
    return unwrapResults(data);
  },

  adjust: async (payload: {
    customer_id: string;
    points: number;
    description: string;
  }): Promise<LoyaltyTransaction> => {
    const { data } = await apiClient.post("/customers/loyalty-transactions/adjust/", payload);
    return data;
  },
};

// ---------------------------------------------------------------------------
// Saved Carts
// ---------------------------------------------------------------------------

export const savedCartsApi = {
  list: async (customerId: string): Promise<SavedCart[]> => {
    const { data } = await apiClient.get(`/customers/saved-carts/?customer=${customerId}`);
    return unwrapResults(data);
  },

  create: async (payload: {
    store: string;
    customer: string;
    name: string;
  }): Promise<SavedCart> => {
    const { data } = await apiClient.post("/customers/saved-carts/", payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/customers/saved-carts/${id}/`);
  },

  addItem: async (
    cartId: string,
    payload: { product_id: string; variant_id?: string; quantity?: number; unit_price?: number },
  ) => {
    const { data } = await apiClient.post(
      `/customers/saved-carts/${cartId}/add-item/`,
      payload,
    );
    return data;
  },

  removeItem: async (cartId: string, itemId: string) => {
    await apiClient.delete(`/customers/saved-carts/${cartId}/remove-item/`, {
      data: { item_id: itemId },
    });
  },
};

// ===========================================================================
// React Query Hooks
// ===========================================================================

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

// -- Address hooks ----------------------------------------------------------

export function useAddresses(customerId: string) {
  return useQuery({
    queryKey: ["customers", customerId, "addresses"],
    queryFn: () => addressesApi.list(customerId),
    enabled: !!customerId,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addressesApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers", variables.customer, "addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Address>) =>
      addressesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addressesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addressesApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

// -- Wishlist hooks ---------------------------------------------------------

export function useWishlist(customerId: string) {
  return useQuery({
    queryKey: ["customers", customerId, "wishlist"],
    queryFn: () => wishlistApi.list(customerId),
    enabled: !!customerId,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wishlistApi.add,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers", variables.customer, "wishlist"] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wishlistApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

// -- Review hooks -----------------------------------------------------------

export function useCustomerReviews(customerId: string) {
  return useQuery({
    queryKey: ["customers", customerId, "reviews"],
    queryFn: () => reviewsApi.list({ customer: customerId }),
    enabled: !!customerId,
  });
}

export function useApproveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useRejectReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

// -- Loyalty hooks ----------------------------------------------------------

export function useLoyaltyTransactions(customerId: string) {
  return useQuery({
    queryKey: ["customers", customerId, "loyalty"],
    queryFn: () => loyaltyApi.list(customerId),
    enabled: !!customerId,
  });
}

export function useAdjustLoyalty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loyaltyApi.adjust,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

// -- Saved Cart hooks -------------------------------------------------------

export function useSavedCarts(customerId: string) {
  return useQuery({
    queryKey: ["customers", customerId, "saved-carts"],
    queryFn: () => savedCartsApi.list(customerId),
    enabled: !!customerId,
  });
}

export function useDeleteSavedCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savedCartsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-carts"] });
    },
  });
}
