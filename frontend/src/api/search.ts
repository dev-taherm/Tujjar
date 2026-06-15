import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { SearchResult, SearchQueryLog } from "@/shared/types";

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
    return unwrapResults(data);
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
