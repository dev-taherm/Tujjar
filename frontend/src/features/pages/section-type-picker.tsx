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
      <div className="border-b border-line -mx-6 px-6 -mt-2 pt-0 pb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={t("searchSections")} />
        <div className="mt-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
              activeCategory === "all" ? "bg-primary-600 text-white" : "bg-rail text-ink-soft hover:bg-rail"
            }`}
          >
            {t("all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                activeCategory === cat ? "bg-primary-600 text-white" : "bg-rail text-ink-soft hover:bg-rail"
              }`}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto -mx-6 px-6">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">{t("noSectionsFound")}</p>
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
                      ? "cursor-not-allowed border-line bg-rail opacity-50"
                      : "border-line hover:border-primary-300 hover:bg-primary-50"
                  }`}
                >
                  <Icon className={`h-8 w-8 ${atLimit ? "text-ink-soft" : "text-ink-soft group-hover:text-primary-600"}`} />
                  <div>
                    <p className="text-sm font-medium text-ink">{def.label}</p>
                    <p className="text-xs text-ink-soft capitalize">{def.category}</p>
                    {atLimit && (
                      <p className="mt-1 text-[10px] font-medium text-warning">(Max reached)</p>
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
