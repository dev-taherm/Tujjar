"use client";

import { useState, type ComponentType } from "react";
import { getAllSectionTypes } from "@/builder/sections/registry";
import type { Section, SectionDefinition } from "@/shared/types";
import * as Icons from "lucide-react";
import { Dialog, SearchInput } from "@/shared/ui";
import { useTranslations } from "next-intl";

interface SectionTypePickerProps {
  onSelect: (type: string) => void;
  onClose: () => void;
  sections?: Section[];
}

const categories = ["hero", "products", "content", "social", "layout"] as const;
const categoryLabels: Record<string, string> = {
  hero: "Hero",
  products: "Products",
  content: "Content",
  social: "Social Proof",
  layout: "Layout",
};

export function SectionTypePicker({ onSelect, onClose, sections }: SectionTypePickerProps) {
  const t = useTranslations("dashboard.pages");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const allTypes = getAllSectionTypes();

  const countsByType = (sections || []).reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  const filtered = allTypes.filter((def) => {
    const matchesSearch = !search || def.label.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || def.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Box;
  };

  return (
    <Dialog open={true} onClose={onClose} title={t("addSection")}>
      <div className="border-b border-gray-200 -mx-6 px-6 -mt-2 pt-0 pb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={t("searchSections")} />
        <div className="mt-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
              activeCategory === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t("all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                activeCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto -mx-6 px-6">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">{t("noSectionsFound")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((def: SectionDefinition) => {
              const Icon = getIcon(def.icon);
              const currentCount = countsByType[def.type] || 0;
              const atLimit = def.limit !== undefined && currentCount >= def.limit;
              return (
                <button
                  key={def.type}
                  onClick={() => { if (!atLimit) { onSelect(def.type); onClose(); } }}
                  disabled={atLimit}
                  className={`group flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors ${
                    atLimit
                      ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <Icon className={`h-8 w-8 ${atLimit ? "text-gray-300" : "text-gray-400 group-hover:text-blue-600"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{def.label}</p>
                    <p className="text-xs text-gray-500 capitalize">{def.category}</p>
                    {atLimit && (
                      <p className="mt-1 text-[10px] font-medium text-amber-600">(Max reached)</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Dialog>
  );
}
