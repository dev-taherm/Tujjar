"use client";

import { Badge, Button } from "@/shared/ui";
import { getRegistryEntry } from "@/builder/sections/registry";
import type { Section } from "@/shared/types";
import { GripVertical, Eye, EyeOff, Copy, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import * as Icons from "lucide-react";

interface SectionListProps {
  sections: Section[];
  selectedSectionId: string | null;
  onSelect: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleVisibility: (id: string, device: string) => void;
}

export function SectionList({
  sections, selectedSectionId, onSelect, onMoveUp, onMoveDown, onDuplicate, onRemove, onToggleVisibility,
}: SectionListProps) {
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Box;
  };

  return (
    <div className="space-y-1">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-900">Sections</h3>
        <Badge variant="secondary">{sections.length}</Badge>
      </div>
      {sections.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
          <p className="text-sm text-gray-500">No sections yet. Click &quot;Add Section&quot; to start.</p>
        </div>
      ) : (
        sections.map((section, index) => {
          const def = getRegistryEntry(section.type);
          const Icon = def ? getIcon(def.icon) : Icons.Box;
          const isSelected = section.id === selectedSectionId;
          return (
            <div
              key={section.id}
              onClick={() => onSelect(section.id)}
              className={`group flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
              <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="flex-1 truncate text-sm font-medium">{def?.label || section.type}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onMoveUp(index); }} disabled={index === 0} className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onMoveDown(index); }} disabled={index === sections.length - 1} className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30">
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id, "desktop"); }} className="rounded p-0.5 hover:bg-gray-200">
                  {section.visibility.desktop ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-gray-400" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDuplicate(section.id); }} className="rounded p-0.5 hover:bg-gray-200">
                  <Copy className="h-3 w-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRemove(section.id); }} className="rounded p-0.5 hover:bg-red-100">
                  <Trash2 className="h-3 w-3 text-red-500" />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
