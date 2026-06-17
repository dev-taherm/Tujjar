"use client";

import { Badge } from "@/shared/ui";
import { Eye, Check, Loader2, Copy, Trash2 } from "lucide-react";
import type { Template } from "@/api/templates";
import { useTranslations } from "next-intl";

const CATEGORY_COLORS: Record<string, string> = {
  fashion: "bg-pink-100 text-pink-800",
  electronics: "bg-blue-100 text-blue-800",
  restaurant: "bg-orange-100 text-orange-800",
  pharmacy: "bg-emerald-100 text-emerald-800",
  furniture: "bg-amber-100 text-amber-800",
  general: "bg-gray-100 text-gray-800",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  fashion: "from-rose-100 via-rose-50 to-white",
  electronics: "from-blue-900 via-blue-800 to-slate-900",
  restaurant: "from-amber-100 via-orange-50 to-white",
  pharmacy: "from-teal-100 via-emerald-50 to-white",
  furniture: "from-stone-100 via-amber-50 to-white",
  general: "from-gray-100 to-white",
};

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onInstall: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  isInstalling?: boolean;
  showInstallButton?: boolean;
}

export function TemplateCard({ template, onPreview, onInstall, onDuplicate, onDelete, isInstalling, showInstallButton = true }: TemplateCardProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const gradient = CATEGORY_GRADIENTS[template.category] || CATEGORY_GRADIENTS.general;
  const colorClass = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.general;

  const colors = (template.config as Record<string, unknown>)?.colors as Record<string, string> | undefined;

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg">
      {/* Thumbnail */}
      <div className={`relative h-48 bg-gradient-to-br ${gradient} p-6`}>
        <div className="absolute bottom-4 left-4 flex gap-2">
          {colors && (
            <>
              <div className="h-5 w-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: colors.primary }} />
              <div className="h-5 w-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: colors.secondary }} />
              <div className="h-5 w-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: colors.accent }} />
            </>
          )}
        </div>
        {template.is_premium && (
          <Badge className="absolute right-3 top-3 bg-amber-500 text-white">Premium</Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
          <Badge variant="secondary" className={colorClass}>
            {template.category}
          </Badge>
        </div>
        <p className="mb-3 line-clamp-2 text-sm text-gray-500">{template.description}</p>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {tag}
            </span>
          ))}
        </div>

        {/* Meta */}
        <div className="mb-4 flex items-center gap-4 text-xs text-gray-400">
          <span>{template.page_count} {t("pagesCount")}</span>
          <span>v{template.version}</span>
          <span>by {template.author}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(template)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            {t("browseTemplates").split(" ")[0]}
          </button>
          {showInstallButton && (
            <button
              onClick={() => onInstall(template)}
              disabled={isInstalling}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isInstalling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isInstalling ? t("installing") : t("installTemplate").split(" ")[0]}
            </button>
          )}
        </div>

        {/* Non-system actions */}
        {!template.is_system && (onDuplicate || onDelete) && (
          <div className="mt-2 flex gap-2">
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(template)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                <Copy className="h-3 w-3" />
                {t("duplicate")}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(template)}
                className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
                {tc("delete")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
