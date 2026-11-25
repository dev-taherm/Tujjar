"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Badge, PageHeader, Table, THead, THeadCell, TBody, TR, TD } from "@/shared/ui";
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
      <PageHeader
        title="Organizations"
        description="Manage all organizations on the platform"
        actions={
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
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
              <THeadCell>Organization</THeadCell>
              <THeadCell>Owner</THeadCell>
              <THeadCell>Members</THeadCell>
              <THeadCell>Stores</THeadCell>
              <THeadCell>Subscription</THeadCell>
              <THeadCell className="text-end">Actions</THeadCell>
            </tr>
          </THead>
          <TBody>
            {data?.results?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-soft">
                  No organizations found.
                </td>
              </tr>
            ) : (
              data?.results?.map((org: AdminOrganization) => (
                <TR key={org.id}>
                  <TD>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-ink-soft">{org.slug}</p>
                  </TD>
                  <TD className="text-sm text-ink-soft">{org.owner_email || "—"}</TD>
                  <TD className="text-sm text-ink-soft tabular-nums">{org.member_count}</TD>
                  <TD className="text-sm text-ink-soft tabular-nums">{org.store_count}</TD>
                  <TD>
                    <Badge
                      variant={
                        org.subscription_status === "active"
                          ? "success"
                          : org.subscription_status
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {org.subscription_status || "None"}
                    </Badge>
                  </TD>
                  <TD className="text-end">
                    <Button
                      size="sm"
                      variant={org.is_active ? "outline" : "default"}
                      onClick={() => toggleActive.mutate({ id: org.id, is_active: !org.is_active })}
                    >
                      {org.is_active ? "Deactivate" : "Activate"}
                    </Button>
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
