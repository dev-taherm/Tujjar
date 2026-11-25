"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Badge, PageHeader, Table, THead, THeadCell, TBody, TR, TD } from "@/shared/ui";
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
      <PageHeader
        title="Stores"
        description="Manage all stores across the platform"
        actions={
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores..."
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
              <THeadCell>Store</THeadCell>
              <THeadCell>Organization</THeadCell>
              <THeadCell>Owner</THeadCell>
              <THeadCell>Domain</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell className="text-end">Actions</THeadCell>
            </tr>
          </THead>
          <TBody>
            {data?.results?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-soft">
                  No stores found.
                </td>
              </tr>
            ) : (
              data?.results?.map((store: AdminStore) => (
                <TR key={store.id}>
                  <TD>
                    <p className="text-sm font-medium">{store.name}</p>
                    <p className="text-xs text-ink-soft">{store.slug}</p>
                  </TD>
                  <TD className="text-sm text-ink-soft">{store.organization_name}</TD>
                  <TD className="text-sm text-ink-soft">{store.owner_email || "—"}</TD>
                  <TD className="text-sm text-ink-soft">{store.custom_domain || "—"}</TD>
                  <TD>
                    <Badge variant={store.is_active ? "success" : "secondary"}>
                      {store.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TD>
                  <TD className="text-end">
                    <Button
                      size="sm"
                      variant={store.is_active ? "outline" : "default"}
                      onClick={() => toggleActive.mutate({ id: store.id, is_active: !store.is_active })}
                    >
                      {store.is_active ? "Deactivate" : "Activate"}
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
