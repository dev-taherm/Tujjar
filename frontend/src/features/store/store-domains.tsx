"use client";

import { useState } from "react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/shared/ui";
import { apiClient } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Trash2, CheckCircle, XCircle } from "lucide-react";
import type { StoreDomain } from "@/shared/types";

interface StoreDomainsProps {
  storeId: string;
}

export function StoreDomains({ storeId }: StoreDomainsProps) {
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState("");

  const { data: domains, isLoading } = useQuery({
    queryKey: ["stores", storeId, "domains"],
    queryFn: async (): Promise<StoreDomain[]> => {
      const { data } = await apiClient.get(`/stores/${storeId}/domains/`);
      return data.results || data;
    },
  });

  const addDomain = useMutation({
    mutationFn: async (domain: string) => {
      const { data } = await apiClient.post(`/stores/${storeId}/domains/`, { domain });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "domains"] });
      setNewDomain("");
    },
  });

  const removeDomain = useMutation({
    mutationFn: async (domainId: string) => {
      await apiClient.delete(`/stores/${storeId}/domains/${domainId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "domains"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Domains</CardTitle>
        <CardDescription>Connect your own domain to this store</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="store.yourdomain.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
          />
          <Button
            onClick={() => addDomain.mutate(newDomain)}
            disabled={!newDomain}
            isLoading={addDomain.isPending}
          >
            Add Domain
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : domains?.length ? (
          <div className="space-y-2">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{domain.domain}</span>
                  {domain.verified ? (
                    <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>
                  ) : (
                    <Badge variant="warning"><XCircle className="mr-1 h-3 w-3" />Pending</Badge>
                  )}
                  {domain.is_primary && <Badge>Primary</Badge>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDomain.mutate(domain.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No custom domains configured.</p>
        )}
      </CardContent>
    </Card>
  );
}
