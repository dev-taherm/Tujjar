"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Badge } from "@/shared/ui";
import type { User } from "@/shared/types";

interface AdminUser extends User {
  is_active: boolean;
  organization_count: number;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const { data } = await apiClient.get(`/platform/users/?${params}`);
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data } = await apiClient.patch(`/platform/users/${id}/`, { is_active });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const toggleStaff = useMutation({
    mutationFn: async ({ id, is_staff }: { id: string; is_staff: boolean }) => {
      const { data } = await apiClient.patch(`/platform/users/${id}/`, { is_staff });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">Manage all platform users</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">User</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Orgs</th>
                <th className="px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : data?.results?.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No users found.</td></tr>
              ) : (
                data?.results?.map((user: AdminUser) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || user.email}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {user.is_staff && <Badge variant="danger">Staff</Badge>}
                        {user.is_superuser && <Badge variant="warning">Super</Badge>}
                        {!user.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.organization_count}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={user.is_active ? "outline" : "default"}
                          onClick={() => toggleActive.mutate({ id: user.id, is_active: !user.is_active })}
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant={user.is_staff ? "outline" : "secondary"}
                          onClick={() => toggleStaff.mutate({ id: user.id, is_staff: !user.is_staff })}
                        >
                          {user.is_staff ? "Revoke Staff" : "Make Staff"}
                        </Button>
                      </div>
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
