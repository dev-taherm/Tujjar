import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { DashboardSummary, RealtimeStats } from "@/shared/types";

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
