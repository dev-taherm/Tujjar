"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Badge, PageHeader, Table, THead, THeadCell, TBody, TR, TD } from "@/shared/ui";
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
      <PageHeader
        title="Users"
        description="Manage all platform users"
        actions={
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="h-10 w-64 rounded-lg border border-line bg-panel px-3 text-sm text-ink transition-colors placeholder:text-ink-soft/70 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 shimmer rounded-lg" />
          ))}
        </div>
      ) : (
        <Table>
          <THead>
            <tr>
              <THeadCell>User</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Orgs</THeadCell>
              <THeadCell>Joined</THeadCell>
              <THeadCell className="text-end">Actions</THeadCell>
            </tr>
          </THead>
          <TBody>
            {data?.results?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-soft">
                  No users found.
                </td>
              </tr>
            ) : (
              data?.results?.map((user: AdminUser) => (
                <TR key={user.id}>
                  <TD>
                    <p className="text-sm font-medium">{user.full_name || user.email}</p>
                    <p className="text-xs text-ink-soft">{user.email}</p>
                  </TD>
                  <TD>
                    <div className="flex gap-1">
                      {user.is_staff && <Badge variant="danger">Staff</Badge>}
                      {user.is_superuser && <Badge variant="warning">Super</Badge>}
                      {!user.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                  </TD>
                  <TD className="text-ink-soft tabular-nums">{user.organization_count}</TD>
                  <TD className="text-ink-soft">{new Date(user.created_at).toLocaleDateString()}</TD>
                  <TD className="text-end">
                    <div className="flex justify-end gap-2">
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
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      )}
    </div>
  );
}
