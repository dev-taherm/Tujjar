"use client";

import { useState } from "react";
import {
  useThemeVersions,
  useThemeVersionDetail,
  useRollbackTheme,
  useCreateSnapshot,
} from "@/api/queries";
import type { ThemeConfig } from "@/shared/types";
import { Button, Badge, Dialog } from "@/shared/ui";
import { formatDateTime } from "@/lib/utils";
import {
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Camera,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ThemeVersionHistoryProps {
  themeId: string;
  onClose: () => void;
}

function VersionPreview({ config }: { config: Record<string, unknown> }) {
  const c = config as unknown as ThemeConfig;
  return (
    <div className="mt-2 rounded-lg border border-line bg-rail p-3">
      <div className="mb-2 flex gap-1.5">
        {[c.colors.primary, c.colors.secondary, c.colors.accent, c.colors.background, c.colors.text]
          .filter(Boolean)
          .map((color, i) => (
            <div
              key={i}
              className="h-5 w-5 rounded-full border border-line"
              style={{ backgroundColor: color }}
            />
          ))}
      </div>
      <div className="space-y-1 text-xs text-ink-soft">
        <p>
          Heading: <span className="font-medium text-ink">{c.typography.headingFont}</span>
        </p>
        <p>
          Body: <span className="font-medium text-ink">{c.typography.bodyFont}</span>
        </p>
        <p>
          Radius: <span className="font-medium text-ink">{c.borderRadius.small}px / {c.borderRadius.medium}px</span>
        </p>
      </div>
    </div>
  );
}

export function ThemeVersionHistory({ themeId, onClose }: ThemeVersionHistoryProps) {
  const t = useTranslations("dashboard.themes");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<{ id: string; version: string } | null>(null);
  const [snapshotNote, setSnapshotNote] = useState("");
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);

  const { data: versions, isLoading } = useThemeVersions(themeId);
  const { data: expandedVersion } = useThemeVersionDetail(themeId, expandedId || "");
  const rollback = useRollbackTheme();
  const createSnapshot = useCreateSnapshot();

  const handleRollback = async () => {
    if (!confirmRollback) return;
    await rollback.mutateAsync({ themeId, versionId: confirmRollback.id });
    toast.success(t("versionRestored") || "Version restored");
    setConfirmRollback(null);
    onClose();
  };

  const handleSnapshot = async () => {
    await createSnapshot.mutateAsync({ themeId, note: snapshotNote });
    toast.success(t("checkpointSaved") || "Checkpoint saved");
    setSnapshotNote("");
    setShowSnapshotDialog(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Dialog open={true} onClose={onClose} title={t("versionHistory") || "Version History"} maxWidth="max-w-xl">
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSnapshotDialog(true)}
        >
          <Camera className="me-1.5 h-3.5 w-3.5" />
          {t("saveCheckpoint") || "Save Checkpoint"}
        </Button>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 shimmer rounded-lg" />
            ))}
          </div>
        ) : !versions?.length ? (
          <p className="py-8 text-center text-sm text-ink-soft">
            {t("noVersions") || "No version history yet"}
          </p>
        ) : (
          versions.map((v, idx) => {
            const isCurrent = idx === 0;
            const isExpanded = expandedId === v.id;
            return (
              <div key={v.id} className="rounded-lg border border-line">
                <div className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(v.id)}
                        className="flex items-center gap-1 text-sm font-medium text-ink hover:text-primary-600"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        {t("version") || "Version"} {v.version}
                      </button>
                      {isCurrent && (
                        <Badge variant="success">{t("currentVersion") || "Current"}</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {v.note || t("noDescription") || "No description"}
                    </p>
                    <p className="text-xs text-ink-soft">{formatDateTime(v.created_at)}</p>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmRollback({ id: v.id, version: v.version })}
                      isLoading={rollback.isPending}
                    >
                      <RotateCcw className="me-1 h-3 w-3" />
                      {t("restore") || "Restore"}
                    </Button>
                  )}
                </div>
                {isExpanded && expandedVersion && expandedVersion.id === v.id && (
                  <div className="border-t border-line px-3 pb-3">
                    <VersionPreview config={expandedVersion.config} />
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
          title={t("restoreVersion") || "Restore Version"}
        >
          <p className="mb-4 text-sm text-ink-soft">
            {t("restoreVersionConfirm", { version: confirmRollback.version }) ||
              `Are you sure you want to restore to version ${confirmRollback.version}? The current state will be saved as a checkpoint first.`}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmRollback(null)}>
              {t("cancel") || "Cancel"}
            </Button>
            <Button onClick={handleRollback} isLoading={rollback.isPending}>
              <RotateCcw className="me-1 h-3 w-3" />
              {t("restore") || "Restore"}
            </Button>
          </div>
        </Dialog>
      )}

      {showSnapshotDialog && (
        <Dialog
          open={true}
          onClose={() => setShowSnapshotDialog(false)}
          title={t("saveCheckpoint") || "Save Checkpoint"}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t("checkpointNote") || "Checkpoint note (optional)"}
              </label>
              <input
                type="text"
                value={snapshotNote}
                onChange={(e) => setSnapshotNote(e.target.value)}
                placeholder="e.g., Before color redesign"
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSnapshotDialog(false)}>
                {t("cancel") || "Cancel"}
              </Button>
              <Button onClick={handleSnapshot} isLoading={createSnapshot.isPending}>
                <Camera className="me-1 h-3 w-3" />
                {t("saveCheckpoint") || "Save Checkpoint"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}
