import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Organization } from "@/shared/types";

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
