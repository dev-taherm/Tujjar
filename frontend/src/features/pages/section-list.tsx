"use client";

import { useState } from "react";
import { Badge, Button } from "@/shared/ui";
import { getRegistryEntry } from "@/builder/sections/registry";
import type { Section } from "@/shared/types";
import { GripVertical, Eye, EyeOff, Copy, Trash2, ChevronUp, ChevronDown, Monitor, Tablet, Smartphone } from "lucide-react";
import * as Icons from "lucide-react";
import type { ComponentType } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard.pages");
  const [showVisMenu, setShowVisMenu] = useState<string | null>(null);
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Box;
  };

  return (
    <div className="space-y-1">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-900">{t("sections")}</h3>
        <Badge variant="secondary">{sections.length}</Badge>
      </div>
      {sections.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
          <p className="text-sm text-gray-500">{t("noSectionsClick")}</p>
        </div>
      ) : (
        sections.map((section, index) => {
          const def = getRegistryEntry(section.type);
          const Icon = def ? getIcon(def.icon) : Icons.Box;
          const isSelected = section.id === selectedSectionId;
          const vis = section.visibility || { desktop: true, tablet: true, mobile: true };
          const allVisible = vis.desktop && vis.tablet && vis.mobile;
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
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowVisMenu(showVisMenu === section.id ? null : section.id); }}
                    className="rounded p-0.5 hover:bg-gray-200"
                    title="Device visibility"
                  >
                    {allVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-amber-500" />}
                  </button>
                  {showVisMenu === section.id && (
                    <div className="absolute right-0 top-6 z-10 w-36 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id, "desktop"); }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-gray-100"
                      >
                        <Monitor className="h-3 w-3" />
                        <span>Desktop</span>
                        <span className={`ms-auto ${vis.desktop ? "text-green-600" : "text-gray-400"}`}>
                          {vis.desktop ? "On" : "Off"}
                        </span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id, "tablet"); }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-gray-100"
                      >
                        <Tablet className="h-3 w-3" />
                        <span>Tablet</span>
                        <span className={`ms-auto ${vis.tablet ? "text-green-600" : "text-gray-400"}`}>
                          {vis.tablet ? "On" : "Off"}
                        </span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id, "mobile"); }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-gray-100"
                      >
                        <Smartphone className="h-3 w-3" />
                        <span>Mobile</span>
                        <span className={`ms-auto ${vis.mobile ? "text-green-600" : "text-gray-400"}`}>
                          {vis.mobile ? "On" : "Off"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
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
