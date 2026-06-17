"use client";

import { useState } from "react";
import {
  useTemplateVersions,
  useTemplateVersionDetail,
  useRollbackTemplate,
  useCreateTemplateSnapshot,
} from "@/api/queries";
import { Button, Badge, Dialog } from "@/shared/ui";
import { formatDateTime } from "@/lib/utils";
import {
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Camera,
  FileText,
  Navigation,
  LayoutGrid,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface TemplateVersionHistoryProps {
  templateId: string;
  onClose: () => void;
}

function VersionPreview({
  config,
  pages,
  navigation,
  footer,
}: {
  config: Record<string, unknown>;
  pages: Array<{ title: string; slug: string; page_type: string; sections: Array<{ type: string }> }>;
  navigation: { logo_text?: string; links?: Array<unknown> };
  footer: { columns?: Array<unknown>; copyright?: string };
}) {
  const t = useTranslations("dashboard.templates");
  const colors = config?.colors as Record<string, string> | undefined;

  return (
    <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
      {colors && (
        <div className="flex gap-1.5">
          {[colors.primary, colors.secondary, colors.accent, colors.background, colors.text]
            .filter(Boolean)
            .map((color, i) => (
              <div
                key={i}
                className="h-5 w-5 rounded-full border border-gray-200"
                style={{ backgroundColor: color }}
              />
            ))}
        </div>
      )}
      <div className="space-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          <span>
            {pages?.length || 0} {t("pagesCount")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Navigation className="h-3 w-3" />
          <span>
            {navigation?.logo_text || "Nav"} &middot; {navigation?.links?.length || 0} links
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="h-3 w-3" />
          <span>{footer?.columns?.length || 0} footer columns</span>
        </div>
      </div>
    </div>
  );
}

export function TemplateVersionHistory({ templateId, onClose }: TemplateVersionHistoryProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<{ id: string; version: string } | null>(null);
  const [snapshotNote, setSnapshotNote] = useState("");
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);

  const { data: versions, isLoading } = useTemplateVersions(templateId);
  const { data: expandedVersion } = useTemplateVersionDetail(templateId, expandedId || "");
  const rollback = useRollbackTemplate();
  const createSnapshot = useCreateTemplateSnapshot();

  const handleRollback = async () => {
    if (!confirmRollback) return;
    await rollback.mutateAsync({ templateId, versionId: confirmRollback.id });
    toast.success(t("versionRestored"));
    setConfirmRollback(null);
    onClose();
  };

  const handleSnapshot = async () => {
    await createSnapshot.mutateAsync({ templateId, note: snapshotNote });
    toast.success(t("checkpointSaved"));
    setSnapshotNote("");
    setShowSnapshotDialog(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Dialog open={true} onClose={onClose} title={t("versionHistory")} maxWidth="max-w-xl">
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSnapshotDialog(true)}
        >
          <Camera className="me-1.5 h-3.5 w-3.5" />
          {t("saveCheckpoint")}
        </Button>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : !versions?.length ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {t("noVersions")}
          </p>
        ) : (
          versions.map((v, idx) => {
            const isCurrent = idx === 0;
            const isExpanded = expandedId === v.id;
            return (
              <div key={v.id} className="rounded-lg border border-gray-200">
                <div className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(v.id)}
                        className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        {t("version")} {v.version}
                      </button>
                      {isCurrent && (
                        <Badge variant="success">{t("currentVersion")}</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {v.note || t("noDescription")}
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(v.created_at)}</p>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmRollback({ id: v.id, version: v.version })}
                      isLoading={rollback.isPending}
                    >
                      <RotateCcw className="me-1 h-3 w-3" />
                      {t("restore")}
                    </Button>
                  )}
                </div>
                {isExpanded && expandedVersion && expandedVersion.id === v.id && (
                  <div className="border-t border-gray-100 px-3 pb-3">
                    <VersionPreview
                      config={expandedVersion.config}
                      pages={expandedVersion.pages}
                      navigation={expandedVersion.navigation}
                      footer={expandedVersion.footer}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {confirmRollback && (
        <Dialog
          open={true}
          onClose={() => setConfirmRollback(null)}
          title={t("restoreVersion")}
        >
          <p className="mb-4 text-sm text-gray-600">
            {t("restoreVersionConfirm", { version: confirmRollback.version })}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmRollback(null)}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleRollback} isLoading={rollback.isPending}>
              <RotateCcw className="me-1 h-3 w-3" />
              {t("restore")}
            </Button>
          </div>
        </Dialog>
      )}

      {showSnapshotDialog && (
        <Dialog
          open={true}
          onClose={() => setShowSnapshotDialog(false)}
          title={t("saveCheckpoint")}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("checkpointNote")}
              </label>
              <input
                type="text"
                value={snapshotNote}
                onChange={(e) => setSnapshotNote(e.target.value)}
                placeholder="e.g., Before adding new pages"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSnapshotDialog(false)}>
                {tc("cancel")}
              </Button>
              <Button onClick={handleSnapshot} isLoading={createSnapshot.isPending}>
                <Camera className="me-1 h-3 w-3" />
                {t("saveCheckpoint")}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}
