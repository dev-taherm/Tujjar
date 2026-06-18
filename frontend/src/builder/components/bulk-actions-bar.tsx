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
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          {count} {count === 1 ? t("sectionSelected") : t("sectionsSelected")}
        </span>

        <div className="h-5 w-px bg-gray-200" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveUp(selectedIds)}
            disabled={!canMoveUp}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
            title={t("moveUp")}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMoveDown(selectedIds)}
            disabled={!canMoveDown}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
            title={t("moveDown")}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200" />

        <button
          onClick={() => onDuplicate(selectedIds)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600"
        >
          <Copy className="h-4 w-4" /> {t("duplicate")}
        </button>

        <button
          onClick={() => onRemove(selectedIds)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" /> {t("delete")}
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <button
          onClick={clearSelection}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
