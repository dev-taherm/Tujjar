"use client";

import { Button, Badge } from "@/shared/ui";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import { Save, Eye, EyeOff, Plus, History } from "lucide-react";
import { useTranslations } from "next-intl";

interface PageToolbarProps {
  pageTitle: string;
  isPublished: boolean;
  version: number;
  isDirty: boolean;
  isPreviewMode: boolean;
  editLocale: string;
  onAddSection: () => void;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onTogglePreview: () => void;
  onShowHistory: () => void;
  onLocaleChange: (locale: string) => void;
  isSaving?: boolean;
}

export function PageToolbar({
  pageTitle, isPublished, version, isDirty, isPreviewMode, editLocale,
  onAddSection, onSave, onPublish, onUnpublish, onTogglePreview, onShowHistory, onLocaleChange, isSaving,
}: PageToolbarProps) {
  const t = useTranslations("dashboard.pages");
  const tc = useTranslations("common");
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
        {isPublished ? (
          <Badge variant="success">{tc("published")}</Badge>
        ) : (
          <Badge variant="secondary">{tc("draft")}</Badge>
        )}
        <span className="text-xs text-gray-400">v{version}</span>
        {isDirty && <Badge variant="warning">{t("unsaved")}</Badge>}
        <LocaleToggle value={editLocale} onChange={onLocaleChange} />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onAddSection}>
          <Plus className="me-1 h-4 w-4" /> {t("addSection")}
        </Button>
        <Button variant="outline" size="sm" onClick={onTogglePreview}>
          {isPreviewMode ? <EyeOff className="me-1 h-4 w-4" /> : <Eye className="me-1 h-4 w-4" />}
          {isPreviewMode ? tc("edit") : t("preview")}
        </Button>
        <Button variant="outline" size="sm" onClick={onShowHistory}>
          <History className="me-1 h-4 w-4" /> {t("history")}
        </Button>
        <Button size="sm" onClick={onSave} isLoading={isSaving} disabled={!isDirty}>
          <Save className="me-1 h-4 w-4" /> {tc("save")}
        </Button>
        {isPublished ? (
          <Button variant="destructive" size="sm" onClick={onUnpublish}>{t("unpublish")}</Button>
        ) : (
          <Button size="sm" onClick={onPublish}>{t("publish")}</Button>
        )}
      </div>
    </div>
  );
}
