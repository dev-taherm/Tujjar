"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useTemplates } from "@/api/queries";
import type { Template } from "@/api/templates";
import { TemplateDuplicateDialog } from "./template-duplicate-dialog";
import { TemplateDeleteDialog } from "./template-delete-dialog";
import { LayoutTemplate, ExternalLink, Copy, Trash2, Clock } from "lucide-react";
import { Badge } from "@/shared/ui";
import { formatDateTime } from "@/lib/utils";

export function TemplateList() {
  const t = useTranslations("dashboard.templates");
  const locale = useLocale();
  const { data, isLoading } = useTemplates();
  const [duplicateTemplate, setDuplicateTemplate] = useState<Template | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null);

  const templates = (data?.results || []).filter((tpl) => !tpl.is_system);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!templates.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 py-12 text-center">
        <LayoutTemplate className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">{t("noTemplatesYet")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-xs text-gray-500">v{template.version} &middot; {template.page_count} pages</p>
              </div>
              <Badge variant="secondary">{template.category}</Badge>
            </div>
            {template.description && (
              <p className="mb-3 line-clamp-2 text-sm text-gray-500">{template.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {formatDateTime(template.updated_at)}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/${locale}/dashboard/templates/${template.id}`}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Edit"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => setDuplicateTemplate(template)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTemplate(template)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {duplicateTemplate && (
        <TemplateDuplicateDialog
          template={duplicateTemplate}
          open={true}
          onClose={() => setDuplicateTemplate(null)}
        />
      )}
      {deleteTemplate && (
        <TemplateDeleteDialog
          template={deleteTemplate}
          open={true}
          onClose={() => setDeleteTemplate(null)}
        />
      )}
    </>
  );
}
