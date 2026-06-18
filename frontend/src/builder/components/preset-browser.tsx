"use client";

import { useState, useMemo } from "react";
import { getAllSectionTypes, getRegistryEntry } from "@/builder/sections/registry";
import { useTranslations } from "next-intl";
import { X, Search, Star } from "lucide-react";
import type { Section } from "@/shared/types";

interface PresetBrowserProps {
  onSelect: (type: string, settings: Record<string, unknown>) => void;
  onClose: () => void;
  sections: Section[];
}

const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero",
  products: "Products",
  content: "Content",
  social: "Social",
  layout: "Layout",
};

export function PresetBrowser({ onSelect, onClose, sections }: PresetBrowserProps) {
  const t = useTranslations("dashboard.pages");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allTypes = useMemo(() => getAllSectionTypes(), []);

  const filteredTypes = useMemo(() => {
    return allTypes.filter((def) => {
      if (selectedCategory && def.category !== selectedCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        if (def.label.toLowerCase().includes(q)) return true;
        if (def.presets?.some((p) => p.label.toLowerCase().includes(q))) return true;
        return false;
      }
      return true;
    });
  }, [allTypes, selectedCategory, search]);

  const categories = useMemo(() => {
    const cats = new Set(allTypes.map((d) => d.category));
    return Array.from(cats);
  }, [allTypes]);

  const handlePresetSelect = (type: string, preset: { name: string; settings: Record<string, unknown> }) => {
    onSelect(type, preset.settings);
  };

  const handleDefaultSelect = (type: string) => {
    const def = getRegistryEntry(type);
    if (def) {
      onSelect(type, { ...def.defaultSettings });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("presetBrowser")}</h2>
            <p className="text-sm text-gray-500">{t("presetBrowserDesc")}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-200 px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPresets")}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedCategory ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredTypes.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-500">{t("noPresetsFound")}</div>
          ) : (
            <div className="space-y-6">
              {filteredTypes.map((def) => (
                <div key={def.type}>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{def.label}</h3>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{def.category}</span>
                    {def.limit && <span className="text-xs text-amber-600">Max {def.limit}</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleDefaultSelect(def.type)}
                      className="group rounded-lg border border-gray-200 p-3 text-left transition-all hover:border-blue-300 hover:shadow-sm"
                    >
                      <div className="mb-1 text-xs font-medium text-gray-700 group-hover:text-blue-600">Default</div>
                      <div className="text-xs text-gray-400 line-clamp-2">{JSON.stringify(def.defaultSettings).slice(0, 60)}...</div>
                    </button>

                    {def.presets?.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(def.type, preset)}
                        className="group rounded-lg border border-gray-200 p-3 text-left transition-all hover:border-blue-300 hover:shadow-sm"
                      >
                        <div className="mb-1 flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400" />
                          <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">{preset.label}</span>
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-2">{JSON.stringify(preset.settings).slice(0, 60)}...</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
