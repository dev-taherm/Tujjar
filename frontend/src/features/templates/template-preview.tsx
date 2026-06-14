"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import type { Template } from "@/api/templates";
import { useTranslations } from "next-intl";

interface TemplatePreviewProps {
  template: Template;
  onClose: () => void;
  onInstall: (template: Template) => void;
  isInstalling?: boolean;
}

export function TemplatePreview({ template, onClose, onInstall, isInstalling }: TemplatePreviewProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const pages = template.pages || [];
  const colors = (template.config as Record<string, unknown>)?.colors as Record<string, string> | undefined;
  const typography = (template.config as Record<string, unknown>)?.typography as Record<string, string> | undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-500">v{template.version} by {template.author}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {/* Color Palette */}
          {colors && (
            <div className="border-b px-6 py-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">{t("colorPalette")}</h3>
              <div className="flex gap-3">
                {["primary", "secondary", "accent", "background", "text"].map((key) => (
                  <div key={key} className="text-center">
                    <div
                      className="mb-1 h-10 w-10 rounded-lg border border-gray-200 shadow-inner"
                      style={{ backgroundColor: colors[key] }}
                    />
                    <span className="text-xs text-gray-500">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Typography */}
          {typography && (
            <div className="border-b px-6 py-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">{t("browseTemplates").split(" ")[0]}</h3>
              <div className="flex gap-8">
                <div>
                  <span className="text-xs text-gray-400">Heading</span>
                  <p style={{ fontFamily: typography.headingFont }} className="text-lg font-bold text-gray-900">
                    {typography.headingFont}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Body</span>
                  <p style={{ fontFamily: typography.bodyFont }} className="text-lg text-gray-700">
                    {typography.bodyFont}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pages */}
          <div className="border-b px-6 py-4">
            <h3 className="mb-3 text-sm font-medium text-gray-700">{t("pagesCount")} ({pages.length})</h3>
            <div className="flex flex-wrap gap-2">
              {pages.map((page, i) => (
                <button
                  key={page.slug || i}
                  onClick={() => setActivePageIndex(i)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    i === activePageIndex
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {page.title}
                </button>
              ))}
            </div>
          </div>

          {/* Active Page Preview */}
          {pages[activePageIndex] && (
            <div className="px-6 py-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                {pages[activePageIndex].title} — Sections
              </h3>
              <div className="space-y-2">
                {pages[activePageIndex].sections.map((section, j) => (
                  <div key={j} className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {section.type}
                    </span>
                    <span className="text-sm text-gray-600">
                      {String(section.settings.title || (typeof section.settings.htmlContent === "string" ? section.settings.htmlContent.slice(0, 60) : "") || "Section")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200">
            {tc("close")}
          </button>
          <button
            onClick={() => onInstall(template)}
            disabled={isInstalling}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isInstalling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isInstalling ? t("installing") : t("installTemplate")}
          </button>
        </div>
      </div>
    </div>
  );
}
