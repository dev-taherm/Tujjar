"use client";
import { Button, Badge } from "@/shared/ui";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import { Save, Eye, EyeOff, Plus, History, Palette, Monitor, Tablet, Smartphone, Layers, LayoutGrid, Play, ExternalLink, PenTool } from "lucide-react";
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
  isAutoSaving?: boolean;
  lastSavedAt?: Date | null;
  onThemeClick?: () => void;
  themeOverrideCount?: number;
  devicePreview?: "desktop" | "tablet" | "mobile";
  onDeviceChange?: (device: "desktop" | "tablet" | "mobile") => void;
  onToggleLayers?: () => void;
  showLayers?: boolean;
  onPresets?: () => void;
  onLivePreview?: () => void;
  onFullPreview?: () => void;
  isInlineEditing?: boolean;
  onToggleInlineEditing?: () => void;
}

export function PageToolbar({
  pageTitle, isPublished, version, isDirty, isPreviewMode, editLocale,
  onAddSection, onSave, onPublish, onUnpublish, onTogglePreview, onShowHistory, onLocaleChange,
  isSaving, isAutoSaving, lastSavedAt, onThemeClick, themeOverrideCount,
  devicePreview = "desktop", onDeviceChange, onToggleLayers, showLayers, onPresets, onLivePreview, onFullPreview, isInlineEditing, onToggleInlineEditing,
}: PageToolbarProps) {
  const t = useTranslations("dashboard.pages");
  const tc = useTranslations("common");
  const devices = [
    { key: "desktop" as const, icon: Monitor, label: "Desktop" },
    { key: "tablet" as const, icon: Tablet, label: "Tablet" },
    { key: "mobile" as const, icon: Smartphone, label: "Mobile" },
  ];
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
        {isAutoSaving && <Badge variant="info">Saving...</Badge>}
        {!isAutoSaving && lastSavedAt && !isDirty && (
          <span className="text-xs text-gray-400">Saved {lastSavedAt.toLocaleTimeString()}</span>
        )}
        {isDirty && !isAutoSaving && <Badge variant="warning">{t("unsaved")}</Badge>}
        <LocaleToggle value={editLocale} onChange={onLocaleChange} />
      </div>
      <div className="flex items-center gap-2">
        {onDeviceChange && (
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {devices.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => onDeviceChange(key)}
                title={label}
                className={`rounded-md p-1.5 transition-colors ${
                  devicePreview === key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}
        {onToggleLayers && (
          <Button variant={showLayers ? "default" : "outline"} size="sm" onClick={onToggleLayers}>
            <Layers className="me-1 h-4 w-4" /> {t("layers")}
          </Button>
        )}
        {onPresets && (
          <Button variant="outline" size="sm" onClick={onPresets}>
            <LayoutGrid className="me-1 h-4 w-4" /> {t("presets")}
          </Button>
        )}
        {onLivePreview && (
          <Button variant="outline" size="sm" onClick={onLivePreview}>
            <Play className="me-1 h-4 w-4" /> {t("livePreview")}
          </Button>
        )}
        {onFullPreview && (
          <Button variant="outline" size="sm" onClick={onFullPreview}>
            <ExternalLink className="me-1 h-4 w-4" /> {t("fullPreview")}
          </Button>
        )}
        {onToggleInlineEditing && (
          <Button variant={isInlineEditing ? "default" : "outline"} size="sm" onClick={onToggleInlineEditing}>
            <PenTool className="me-1 h-4 w-4" /> {t("inlineEdit")}
          </Button>
        )}
        {onThemeClick && (
          <Button variant="outline" size="sm" onClick={onThemeClick}>
            <Palette className="me-1 h-4 w-4" /> {t("theme")}
            {themeOverrideCount !== undefined && themeOverrideCount > 0 && (
              <span className="ms-1 rounded-full bg-blue-100 px-1.5 text-xs text-blue-700">{themeOverrideCount}</span>
            )}
          </Button>
        )}
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
