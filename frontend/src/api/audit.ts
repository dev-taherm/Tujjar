import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { AuditLogEntry, PaginatedResponse } from "@/shared/types";

interface AuditLogFilters {
  action?: string;
  resource_type?: string;
  user?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export const auditApi = {
  list: async (filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLogEntry>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const { data } = await apiClient.get(`/audit/?${params.toString()}`);
    return data;
  },
};

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => auditApi.list(filters),
  });
}
