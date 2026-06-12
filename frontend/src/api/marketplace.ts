import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { MarketplaceListing, MarketplaceReview } from "@/shared/types";

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
