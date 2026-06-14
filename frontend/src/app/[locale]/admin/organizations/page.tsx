"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Badge } from "@/shared/ui";
import type { Organization } from "@/shared/types";

interface AdminOrganization extends Organization {
  store_count: number;
  subscription_status: string | null;
}

export default function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orgs", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const { data } = await apiClient.get(`/platform/organizations/?${params}`);
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data } = await apiClient.patch(`/platform/organizations/${id}/`, { is_active });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orgs"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500">Manage all organizations on the platform</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organizations..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Organization</th>
                <th className="px-4 py-3 font-medium text-gray-500">Owner</th>
                <th className="px-4 py-3 font-medium text-gray-500">Members</th>
                <th className="px-4 py-3 font-medium text-gray-500">Stores</th>
                <th className="px-4 py-3 font-medium text-gray-500">Subscription</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : data?.results?.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No organizations found.</td></tr>
              ) : (
                data?.results?.map((org: AdminOrganization) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{org.name}</p>
                        <p className="text-xs text-gray-500">{org.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{org.owner_email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{org.member_count}</td>
                    <td className="px-4 py-3 text-gray-600">{org.store_count}</td>
                    <td className="px-4 py-3">
                      <Badge variant={org.subscription_status === "active" ? "success" : org.subscription_status ? "warning" : "secondary"}>
                        {org.subscription_status || "None"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={org.is_active ? "outline" : "default"}
                        onClick={() => toggleActive.mutate({ id: org.id, is_active: !org.is_active })}
                      >
                        {org.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
