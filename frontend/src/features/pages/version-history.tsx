"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Badge, Dialog } from "@/shared/ui";
import type { PageVersion } from "@/shared/types";
import { formatDateTime } from "@/lib/utils";
import { RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface VersionHistoryProps {
  pageId: string;
  onClose: () => void;
}

export function VersionHistory({ pageId, onClose }: VersionHistoryProps) {
  const t = useTranslations("dashboard.pages");
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
    <Dialog open={true} onClose={onClose} title={t("versionHistory")}>
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : !versions?.length ? (
          <p className="text-center text-gray-500">{t("noVersions")}</p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t("version")} {v.version}</span>
                    {v.version === versions[0]?.version && <Badge variant="success">{t("current")}</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{v.change_summary || t("noDescription")}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(v.created_at)}</p>
                </div>
                {v.version !== versions[0]?.version && (
                  <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate(v.version)} isLoading={restoreMutation.isPending}>
                    <RotateCcw className="me-1 h-3 w-3" /> {t("restore")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
