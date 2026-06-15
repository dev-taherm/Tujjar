import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { unwrapResults } from "./helpers";
import type { Organization } from "@/shared/types";

export const organizationsApi = {
  list: async (): Promise<Organization[]> => {
    const { data } = await apiClient.get("/organizations/");
    return unwrapResults(data);
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

export const teamsApi = {
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

  removeMember: async (orgId: string, userId: string) => {
    const { data } = await apiClient.delete(`/organizations/${orgId}/remove-member/`, {
      data: { user_id: userId },
    });
    return data;
  },

  getRoles: async (orgId: string) => {
    const { data } = await apiClient.get(`/organizations/${orgId}/roles/`);
    return data;
  },

  getPermissions: async () => {
    const { data } = await apiClient.get("/organizations/permissions/");
    return data;
  },

  acceptInvite: async (orgId: string) => {
    const { data } = await apiClient.post(`/organizations/${orgId}/accept-invite/`);
    return data;
  },
};

export function useMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: ["members", orgId],
    queryFn: () => teamsApi.getMembers(orgId!),
    enabled: !!orgId,
  });
}

export function useRoles(orgId: string | undefined) {
  return useQuery({
    queryKey: ["roles", orgId],
    queryFn: () => teamsApi.getRoles(orgId!),
    enabled: !!orgId,
  });
}
