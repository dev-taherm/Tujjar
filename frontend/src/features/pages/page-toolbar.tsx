"use client";
import { Button, Badge, Tooltip } from "@/shared/ui";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import {
  Save, Eye, EyeOff, Plus, History, Palette, Monitor, Tablet, Smartphone,
  Layers, LayoutGrid, Play, ExternalLink, PenTool,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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

/* Toolbar diet: secondary actions collapse to icon buttons with tooltips;
   only Add Section / Save / Publish keep their weight. */
function IconButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Tooltip label={label} side="bottom">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors active:scale-[0.96]",
          active
            ? "bg-primary-50 text-primary-600"
            : "text-ink-soft hover:bg-rail hover:text-ink"
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />;

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
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-panel px-4 py-2.5">
      {/* Identity */}
      <div className="flex min-w-0 items-center gap-2.5">
        <h2 className="truncate text-base font-semibold text-ink">{pageTitle}</h2>
        {isPublished ? (
          <Badge variant="success">{tc("published")}</Badge>
        ) : (
          <Badge variant="secondary">{tc("draft")}</Badge>
        )}
        <span className="text-xs text-ink-soft tabular-nums">v{version}</span>
        {isAutoSaving && <Badge variant="info">Saving…</Badge>}
        {!isAutoSaving && lastSavedAt && !isDirty && (
          <span className="hidden text-xs text-ink-soft sm:inline">
            Saved {lastSavedAt.toLocaleTimeString()}
          </span>
        )}
        {isDirty && !isAutoSaving && <Badge variant="warning">{t("unsaved")}</Badge>}
        <LocaleToggle value={editLocale} onChange={onLocaleChange} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onDeviceChange && (
          <>
            <div className="flex items-center rounded-lg border border-line bg-rail p-0.5">
              {devices.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => onDeviceChange(key)}
                  title={label}
                  aria-label={label}
                  aria-pressed={devicePreview === key}
                  className={`rounded-md p-1.5 transition-colors ${
                    devicePreview === key
                      ? "bg-panel text-primary-600 shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <Divider />
          </>
        )}

        {onToggleLayers && (
          <IconButton icon={Layers} label={t("layers")} onClick={onToggleLayers} active={showLayers} />
        )}
        {onPresets && <IconButton icon={LayoutGrid} label={t("presets")} onClick={onPresets} />}
        {onLivePreview && <IconButton icon={Play} label={t("livePreview")} onClick={onLivePreview} />}
        {onFullPreview && <IconButton icon={ExternalLink} label={t("fullPreview")} onClick={onFullPreview} />}
        {onToggleInlineEditing && (
          <IconButton icon={PenTool} label={t("inlineEdit")} onClick={onToggleInlineEditing} active={isInlineEditing} />
        )}
        {onThemeClick && (
          <Tooltip label={t("theme")} side="bottom">
            <button
              type="button"
              onClick={onThemeClick}
              aria-label={t("theme")}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-rail hover:text-ink active:scale-[0.96]"
            >
              <Palette className="h-4 w-4" />
              {themeOverrideCount !== undefined && themeOverrideCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary-600 px-1 text-[9px] font-bold text-white">
                  {themeOverrideCount}
                </span>
              )}
            </button>
          </Tooltip>
        )}
        <Divider />
        <IconButton
          icon={isPreviewMode ? EyeOff : Eye}
          label={isPreviewMode ? tc("edit") : t("preview")}
          onClick={onTogglePreview}
          active={isPreviewMode}
        />
        <IconButton icon={History} label={t("history")} onClick={onShowHistory} />
        <Divider />

        {/* Primary actions keep their weight */}
        <Button variant="outline" size="sm" onClick={onAddSection}>
          <Plus className="me-1 h-4 w-4" /> {t("addSection")}
        </Button>
        <Button variant="outline" size="sm" onClick={onSave} isLoading={isSaving} disabled={!isDirty}>
          <Save className="me-1 h-4 w-4" /> {tc("save")}
        </Button>
        {isPublished ? (
          <Button variant="destructive" size="sm" onClick={onUnpublish}>
            {t("unpublish")}
          </Button>
        ) : (
          <Button size="sm" onClick={onPublish}>
            {t("publish")}
          </Button>
        )}
      </div>
    </div>
  );
}
