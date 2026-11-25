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
          <div key={i} className="h-40 shimmer rounded-xl" />
        ))}
      </div>
    );
  }

  if (!templates.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-12 text-center">
        <LayoutTemplate className="mx-auto h-10 w-10 text-ink-soft" />
        <p className="mt-3 text-sm text-ink-soft">{t("noTemplatesYet")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group rounded-xl border border-line bg-panel p-4 transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-ink">{template.name}</h3>
                <p className="text-xs text-ink-soft">v{template.version} &middot; {template.page_count} pages</p>
              </div>
              <Badge variant="secondary">{template.category}</Badge>
            </div>
            {template.description && (
              <p className="mb-3 line-clamp-2 text-sm text-ink-soft">{template.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-ink-soft">
                <Clock className="h-3 w-3" />
                {formatDateTime(template.updated_at)}
              </div>
              <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
                <Link
                  href={`/${locale}/dashboard/templates/${template.id}`}
                  className="rounded p-1.5 text-ink-soft hover:bg-rail hover:text-ink-soft"
                  title="Edit"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => setDuplicateTemplate(template)}
                  className="rounded p-1.5 text-ink-soft hover:bg-rail hover:text-ink-soft"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTemplate(template)}
                  className="rounded p-1.5 text-ink-soft hover:bg-error-soft hover:text-error"
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
