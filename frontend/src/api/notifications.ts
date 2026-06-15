import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { Notification, NotificationPreference } from "@/shared/types";

export const notificationsApi = {
  getNotifications: async (params?: { is_read?: boolean }): Promise<Notification[]> => {
    const searchParams = new URLSearchParams();
    if (params?.is_read !== undefined) searchParams.set("is_read", String(params.is_read));
    const qs = searchParams.toString();
    const { data } = await apiClient.get(`/notifications/notifications/${qs ? `?${qs}` : ""}`);
    return unwrapResults(data);
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
