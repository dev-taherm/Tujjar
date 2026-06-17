"use client";

import { useState, type ComponentType } from "react";
import { getAllSectionTypes } from "@/builder/sections/registry";
import type { SectionDefinition } from "@/shared/types";
import * as Icons from "lucide-react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";

interface SectionPaletteProps {
  onAddSection: (type: string) => void;
}

const categories = [
  { key: "hero", label: "Hero" },
  { key: "products", label: "Products" },
  { key: "content", label: "Content" },
  { key: "social", label: "Social Proof" },
] as const;

export function SectionPalette({ onAddSection }: SectionPaletteProps) {
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["hero", "products", "content", "social"]));
  const allTypes = getAllSectionTypes();

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Box;
  };

  const filtered = allTypes.filter((def) => !search || def.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Sections</h3>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-200 py-1.5 ps-8 pe-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
        />
      </div>

      {categories.map(({ key: cat, label }) => {
        const catSections = filtered.filter((s) => s.category === cat);
        if (catSections.length === 0) return null;
        const expanded = expandedCats.has(cat);
        return (
          <div key={cat}>
            <button
              onClick={() => toggleCat(cat)}
              className="flex w-full items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {label}
              <span className="ms-auto text-gray-400">{catSections.length}</span>
            </button>
            {expanded && (
              <div className="mt-1 space-y-1">
                {catSections.map((def: SectionDefinition) => {
                  const Icon = getIcon(def.icon);
                  return (
                    <button
                      key={def.type}
                      onClick={() => onAddSection(def.type)}
                      className="flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-start text-xs transition-colors hover:border-blue-200 hover:bg-blue-50"
                    >
                      <Icon className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">{def.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
