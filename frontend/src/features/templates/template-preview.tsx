"use client";

import { useState } from "react";
import { Loader2, Download, History } from "lucide-react";
import type { Template } from "@/api/templates";
import { Dialog } from "@/shared/ui";
import { useTranslations } from "next-intl";
import { TemplateThumbnail } from "./template-thumbnail";

interface TemplatePreviewProps {
  template: Template;
  onClose: () => void;
  onInstall: (template: Template) => void;
  onExport?: (template: Template) => void;
  onVersionHistory?: (template: Template) => void;
  isInstalling?: boolean;
}

export function TemplatePreview({ template, onClose, onInstall, onExport, onVersionHistory, isInstalling }: TemplatePreviewProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const pages = template.pages || [];
  const colors = (template.config as Record<string, unknown>)?.colors as Record<string, string> | undefined;
  const typography = (template.config as Record<string, unknown>)?.typography as Record<string, string> | undefined;

  return (
    <Dialog open={true} onClose={onClose} title={template.name}>
      <p className="text-sm text-ink-soft -mt-2 mb-4">v{template.version} by {template.author}</p>

      <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
        {/* Thumbnail */}
        <TemplateThumbnail template={template} />

        {/* Color Palette */}
        {colors && (
          <div className="border-b -mx-6 px-6 py-4">
            <h3 className="mb-2 text-sm font-medium text-ink">{t("colorPalette")}</h3>
            <div className="flex gap-3">
              {["primary", "secondary", "accent", "background", "text"].map((key) => (
                <div key={key} className="text-center">
                  <div
                    className="mb-1 h-10 w-10 rounded-lg border border-line shadow-inner"
                    style={{ backgroundColor: colors[key] }}
                  />
                  <span className="text-xs text-ink-soft">{key}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Typography */}
        {typography && (
          <div className="border-b -mx-6 px-6 py-4">
            <h3 className="mb-2 text-sm font-medium text-ink">{t("browseTemplates").split(" ")[0]}</h3>
            <div className="flex gap-8">
              <div>
                <span className="text-xs text-ink-soft">Heading</span>
                <p style={{ fontFamily: typography.headingFont }} className="text-lg font-bold text-ink">
                  {typography.headingFont}
                </p>
              </div>
              <div>
                <span className="text-xs text-ink-soft">Body</span>
                <p style={{ fontFamily: typography.bodyFont }} className="text-lg text-ink">
                  {typography.bodyFont}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pages */}
        <div className="border-b -mx-6 px-6 py-4">
          <h3 className="mb-3 text-sm font-medium text-ink">{t("pagesCount")} ({pages.length})</h3>
          <div className="flex flex-wrap gap-2">
            {pages.map((page, i) => (
              <button
                key={page.slug || i}
                onClick={() => setActivePageIndex(i)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  i === activePageIndex
                    ? "bg-primary-600 text-white"
                    : "bg-rail text-ink-soft hover:bg-rail"
                }`}
              >
                {page.title}
              </button>
            ))}
          </div>
        </div>

        {/* Active Page Preview */}
        {pages[activePageIndex] && (
          <div className="-mx-6 px-6 py-4">
            <h3 className="mb-2 text-sm font-medium text-ink">
              {pages[activePageIndex].title} — Sections
            </h3>
            <div className="space-y-2">
              {pages[activePageIndex].sections.map((section, j) => (
                <div key={j} className="flex items-center gap-3 rounded-lg bg-rail px-4 py-2">
                  <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                    {section.type}
                  </span>
                  <span className="text-sm text-ink-soft">
                    {String(section.settings.title || (typeof section.settings.htmlContent === "string" ? section.settings.htmlContent.slice(0, 60) : "") || "Section")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between -mx-6 px-6 -mb-6 pb-6 pt-4 border-t bg-rail">
        <div className="flex gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:bg-rail">
            {tc("close")}
          </button>
          {onExport && (
            <button
              onClick={() => onExport(template)}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-rail"
            >
              <Download className="h-4 w-4" />
              {t("export")}
            </button>
          )}
          {onVersionHistory && (
            <button
              onClick={() => onVersionHistory(template)}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-rail"
            >
              <History className="h-4 w-4" />
              {t("versionHistory")}
            </button>
          )}
        </div>
        <button
          onClick={() => onInstall(template)}
          disabled={isInstalling}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isInstalling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isInstalling ? t("installing") : t("installTemplate")}
        </button>
      </div>
    </Dialog>
  );
}
