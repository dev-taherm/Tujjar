"use client";

import { usePageBuilder } from "@/builder/providers/page-builder-context";
import { useTranslations } from "next-intl";
import { Copy, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";

interface BulkActionsBarProps {
  onDuplicate: (ids: string[]) => void;
  onRemove: (ids: string[]) => void;
  onMoveUp: (ids: string[]) => void;
  onMoveDown: (ids: string[]) => void;
}

export function BulkActionsBar({ onDuplicate, onRemove, onMoveUp, onMoveDown }: BulkActionsBarProps) {
  const t = useTranslations("dashboard.pages");
  const { selectedSectionIds, clearSelection, sections } = usePageBuilder();
  const count = selectedSectionIds.size;

  if (count === 0) return null;

  const selectedIds = Array.from(selectedSectionIds);
  const firstIndex = sections.findIndex((s) => s.id === selectedIds[0]);
  const canMoveUp = firstIndex > 0;
  const canMoveDown = sections.findIndex((s) => s.id === selectedIds[selectedIds.length - 1]) < sections.length - 1;

  return (
    <div className="fixed bottom-6 start-1/2 z-50 -translate-x-1/2 rounded-xl border border-line bg-panel px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-ink">
          {count} {count === 1 ? t("sectionSelected") : t("sectionsSelected")}
        </span>

        <div className="h-5 w-px bg-rail" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveUp(selectedIds)}
            disabled={!canMoveUp}
            className="rounded-lg p-2 text-ink-soft hover:bg-rail hover:text-ink disabled:opacity-30"
            title={t("moveUp")}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMoveDown(selectedIds)}
            disabled={!canMoveDown}
            className="rounded-lg p-2 text-ink-soft hover:bg-rail hover:text-ink disabled:opacity-30"
            title={t("moveDown")}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="h-5 w-px bg-rail" />

        <button
          onClick={() => onDuplicate(selectedIds)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-soft hover:bg-rail hover:text-primary-600"
        >
          <Copy className="h-4 w-4" /> {t("duplicate")}
        </button>

        <button
          onClick={() => onRemove(selectedIds)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-soft hover:bg-error-soft hover:text-error"
        >
          <Trash2 className="h-4 w-4" /> {t("delete")}
        </button>

        <div className="h-5 w-px bg-rail" />

        <button
          onClick={clearSelection}
          className="rounded-lg p-2 text-ink-soft hover:bg-rail hover:text-ink-soft"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
