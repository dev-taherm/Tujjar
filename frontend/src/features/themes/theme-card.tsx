"use client";

import { Card, CardHeader, CardTitle, CardDescription, Badge, Button } from "@/shared/ui";
import { Palette, Download, ExternalLink, Check } from "lucide-react";
import type { Theme, ThemeConfig } from "@/shared/types";
import { useTranslations } from "next-intl";

interface ThemeCardProps {
  theme: Theme;
  onSelect?: (theme: Theme) => void;
  onInstall?: (theme: Theme) => void;
  isSelected?: boolean;
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

export function ThemeCard({ theme, onSelect, onInstall, isSelected, isInstalling, isInstalled }: ThemeCardProps) {
  const t = useTranslations("dashboard.themes");
  const tc = useTranslations("common");
  return (
    <Card
      className={`group cursor-pointer transition-all hover:shadow-md ${
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
          {theme.is_system && <Badge>{t("system")}</Badge>}
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
          {onInstall && (
            <Button
              size="sm"
              variant={isInstalled ? "secondary" : "default"}
              disabled={isInstalling || isInstalled}
              onClick={(e) => {
                e.stopPropagation();
                if (!isInstalling && !isInstalled) onInstall(theme);
              }}
              className="ms-2 shrink-0"
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
    </Card>
  );
}
