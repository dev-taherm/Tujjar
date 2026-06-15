"use client";

import { useAuthStore } from "@/stores";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { Membership } from "@/shared/types";

export function useMembership() {
  const organization = useAuthStore((s) => s.organization);
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["membership", organization?.id, user?.id],
    queryFn: async () => {
      if (!organization?.id || !user?.id) return null;
      const { data } = await apiClient.get(`/organizations/${organization.id}/members/`);
      const members: Membership[] = Array.isArray(data) ? data : data?.results || [];
      return members.find((m) => m.user === user.id) || null;
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHasPermission(codename: string): boolean {
  const { data: membership } = useMembership();
  const user = useAuthStore((s) => s.user);

  if (!membership) return false;
  if (membership.role_name === "Owner") return true;
  if (user?.is_staff || user?.is_superuser) return true;

  return membership.role_permissions?.includes(codename) ?? false;
}

export function useOrgRole(): string | null {
  const { data: membership } = useMembership();
  return membership?.role_name || null;
}
