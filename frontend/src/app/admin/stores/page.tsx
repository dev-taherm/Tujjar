"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Badge } from "@/shared/ui";
import type { Store } from "@/shared/types";

interface AdminStore extends Store {
  organization_name: string;
  owner_email: string | null;
}

export default function AdminStoresPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stores", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const { data } = await apiClient.get(`/platform/stores/?${params}`);
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data } = await apiClient.patch(`/platform/stores/${id}/`, { is_active });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "stores"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
          <p className="text-sm text-gray-500">Manage all stores across the platform</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stores..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Store</th>
                <th className="px-4 py-3 font-medium text-gray-500">Organization</th>
                <th className="px-4 py-3 font-medium text-gray-500">Owner</th>
                <th className="px-4 py-3 font-medium text-gray-500">Domain</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : data?.results?.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No stores found.</td></tr>
              ) : (
                data?.results?.map((store: AdminStore) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-xs text-gray-500">{store.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{store.organization_name}</td>
                    <td className="px-4 py-3 text-gray-600">{store.owner_email || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{store.custom_domain || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={store.is_active ? "success" : "secondary"}>
                        {store.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={store.is_active ? "outline" : "default"}
                        onClick={() => toggleActive.mutate({ id: store.id, is_active: !store.is_active })}
                      >
                        {store.is_active ? "Deactivate" : "Activate"}
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
