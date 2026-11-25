"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import { getRegistryEntry } from "@/builder/sections/registry";
import { SectionResizeHandle } from "@/builder/components/section-resize-handle";
import * as Icons from "lucide-react";
import type { ComponentType } from "react";
import type { Section } from "@/shared/types";

interface SortableSectionProps {
  section: Section;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onToggleVisibility: (device: string) => void;
  onResize?: (minHeight: string) => void;
  children: React.ReactNode;
}

export function SortableSection({
  section, isSelected, onSelect, onDuplicate, onRemove, onToggleVisibility, onResize, children,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const styleData = (section.settings as Record<string, unknown>).__style as { height?: { minHeight?: string } } | undefined;
  const minHeight = styleData?.height?.minHeight || "";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (minHeight) {
    style.minHeight = minHeight;
  }

  const def = getRegistryEntry(section.type);
  const IconComponent = def ? (Icons as unknown as Record<string, ComponentType<{ className?: string }>>)[def.icon] : Icons.Box;
  const SectionIcon = IconComponent || Icons.Box;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect(e); }}
      className={`group relative rounded-lg border-2 transition-all ${
        isSelected
          ? "border-primary-500 shadow-panel"
          : isDragging
            ? "border-primary-300 opacity-75"
            : "border-transparent hover:border-line"
      }`}
    >
      {/* Top bar */}
      <div className={`absolute -top-10 start-0 end-0 flex items-center justify-between rounded-t-lg px-2 py-1 transition-opacity ${
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}>
        <div className="flex items-center gap-1.5 rounded-md bg-panel px-2 py-1 shadow-sm">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-ink-soft hover:text-ink-soft">
            <GripVertical className="h-4 w-4" />
          </button>
          <SectionIcon className="h-3.5 w-3.5 text-ink-soft" />
          <span className="text-xs font-medium text-ink-soft">{def?.label || section.type}</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-md bg-panel px-1 py-0.5 shadow-sm">
          <button onClick={(e) => { e.stopPropagation(); onToggleVisibility("desktop"); }} className="rounded p-1 hover:bg-rail">
            {section.visibility?.desktop ? <Eye className="h-3.5 w-3.5 text-ink-soft" /> : <EyeOff className="h-3.5 w-3.5 text-ink-soft" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="rounded p-1 hover:bg-rail">
            <Copy className="h-3.5 w-3.5 text-ink-soft" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="rounded p-1 hover:bg-error-soft">
            <Trash2 className="h-3.5 w-3.5 text-error" />
          </button>
        </div>
      </div>

      {children}

      {/* Resize handle */}
      {onResize && (
        <SectionResizeHandle
          sectionId={section.id}
          currentMinHeight={minHeight}
          onResize={onResize}
        />
      )}
    </div>
  );
}
