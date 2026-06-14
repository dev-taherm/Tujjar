"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Badge } from "@/shared/ui";
import type { PageVersion } from "@/shared/types";
import { formatDateTime } from "@/lib/utils";
import { RotateCcw, X } from "lucide-react";

interface VersionHistoryProps {
  pageId: string;
  onClose: () => void;
}

export function VersionHistory({ pageId, onClose }: VersionHistoryProps) {
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ["pages", pageId, "versions"],
    queryFn: async (): Promise<PageVersion[]> => {
      const { data } = await apiClient.get(`/pages/${pageId}/versions/`);
      return data;
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (version: number) => {
      const { data } = await apiClient.post(`/pages/${pageId}/versions/${version}/restore/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", pageId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Version History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-96 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />)}
            </div>
          ) : !versions?.length ? (
            <p className="text-center text-gray-500">No versions yet.</p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {v.version}</span>
                      {v.version === versions[0]?.version && <Badge variant="success">Current</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{v.change_summary || "No description"}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(v.created_at)}</p>
                  </div>
                  {v.version !== versions[0]?.version && (
                    <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate(v.version)} isLoading={restoreMutation.isPending}>
                      <RotateCcw className="me-1 h-3 w-3" /> Restore
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
