"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, Badge, Button, Dialog } from "@/shared/ui";
import { Palette, Download, ExternalLink, Check, Trash2, Copy } from "lucide-react";
import type { Theme, ThemeConfig } from "@/shared/types";
import { useTranslations } from "next-intl";
import { themesApi } from "@/api/themes";
import { useDeleteTheme, useDuplicateTheme } from "@/api/queries";
import { toast } from "sonner";

interface ThemeCardProps {
  theme: Theme;
  onSelect?: (theme: Theme) => void;
  onInstall?: (theme: Theme) => void;
  onApply?: (theme: Theme) => void;
  isSelected?: boolean;
  isActive?: boolean;
  isInstalling?: boolean;
  isInstalled?: boolean;
}

function ColorSwatch({ colors }: { colors: ThemeConfig["colors"] }) {
  return (
    <div className="flex gap-1">
      {[colors.primary, colors.secondary, colors.accent, colors.background, colors.text].map(
        (color, i) => (
          <div
            key={i}
            className="h-6 w-6 rounded-full border border-gray-200"
            style={{ backgroundColor: color }}
          />
        )
      )}
    </div>
  );
}

export function ThemeCard({ theme, onSelect, onInstall, onApply, isSelected, isActive, isInstalling, isInstalled }: ThemeCardProps) {
  const t = useTranslations("dashboard.themes");
  const tc = useTranslations("common");
  const deleteTheme = useDeleteTheme();
  const duplicateTheme = useDuplicateTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState(`${theme.name} Copy`);

  const handleDelete = async () => {
    try {
      await deleteTheme.mutateAsync(theme.id);
      toast.success(t("themeDeleted") || "Theme deleted");
      setShowDeleteDialog(false);
    } catch {
      toast.error(t("deleteFailed") || "Failed to delete theme");
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateName.trim()) return;
    try {
      await duplicateTheme.mutateAsync({ id: theme.id, name: duplicateName.trim() });
      toast.success(t("themeDuplicated") || "Theme duplicated");
      setShowDuplicateDialog(false);
    } catch {
      toast.error(t("duplicateFailed") || "Failed to duplicate theme");
    }
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = await themesApi.exportTheme(theme.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${theme.slug}-v${theme.version}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("exportFailed") || "Failed to export theme");
    }
  };
  return (
    <>
    <Card
      className={`group cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
        isSelected ? "ring-2 ring-primary-500 border-primary-300" : "hover:border-primary-200"
      }`}
      onClick={() => onSelect?.(theme)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: theme.config.colors.primary + "15" }}
            >
              <Palette className="h-6 w-6" style={{ color: theme.config.colors.primary }} />
            </div>
            <div>
              <CardTitle className="text-lg">{theme.name}</CardTitle>
              <CardDescription>v{theme.version}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && <Badge variant="success">{t("active") || "Active"}</Badge>}
            {theme.parent_theme && <Badge variant="secondary">{t("inherits") || "Inherits"}</Badge>}
            {theme.is_system && <Badge>{t("system")}</Badge>}
          </div>
        </div>
      </CardHeader>
      <div className="px-6 pb-2">
        <ColorSwatch colors={theme.config.colors} />
      </div>
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-xs text-gray-500">
            <span>{theme.config.typography.headingFont}</span>
            <span>•</span>
            <span>{theme.config.typography.bodyFont}</span>
            <span>•</span>
            <span>{theme.presets.length} {t("presets")}{theme.presets.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex gap-2">
            {!theme.is_system && (
              <>
                <Button
                  size="default"
                  variant="ghost"
                  onClick={handleExport}
                  className="shrink-0"
                  title={t("export") || "Export"}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="default"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDuplicateName(`${theme.name} Copy`);
                    setShowDuplicateDialog(true);
                  }}
                  className="shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="default"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {onApply && !isActive && (
              <Button
                size="default"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(theme);
                }}
                className="shrink-0"
              >
                {t("applyToStore") || "Apply to Store"}
              </Button>
            )}
            {onInstall && (
              <Button
                size="default"
                variant={isInstalled ? "secondary" : "default"}
                disabled={isInstalling || isInstalled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isInstalling && !isInstalled) onInstall(theme);
                }}
                className="shrink-0"
              >
                {isInstalling ? (
                    <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("installing")}
                  </span>
                ) : isInstalled ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    {t("installed")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    {t("install")}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title={t("deleteTheme") || "Delete Theme"}>
      <p className="text-sm text-gray-500 mb-4">
        {t("deleteThemeConfirm") || `Are you sure you want to delete "${theme.name}"? This action cannot be undone.`}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{tc("cancel")}</Button>
        <Button variant="destructive" onClick={handleDelete} isLoading={deleteTheme.isPending}>
          {tc("delete")}
        </Button>
      </div>
    </Dialog>

    {/* Duplicate Dialog */}
    <Dialog open={showDuplicateDialog} onClose={() => setShowDuplicateDialog(false)} title={t("duplicateTheme") || "Duplicate Theme"}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          {t("duplicateThemeDescription") || "Enter a name for the duplicated theme."}
        </p>
        <input
          type="text"
          value={duplicateName}
          onChange={(e) => setDuplicateName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") handleDuplicate(); }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>{tc("cancel")}</Button>
          <Button onClick={handleDuplicate} disabled={!duplicateName.trim()} isLoading={duplicateTheme.isPending}>
            {tc("duplicate")}
          </Button>
        </div>
      </div>
    </Dialog>
    </>
  );
}
