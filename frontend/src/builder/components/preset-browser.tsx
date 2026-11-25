"use client";

import { useState, useMemo } from "react";
import { getAllSectionTypes, getRegistryEntry } from "@/builder/sections/registry";
import { useTranslations } from "next-intl";
import { X, Search, Star } from "lucide-react";

interface PresetBrowserProps {
  onSelect: (type: string, settings: Record<string, unknown>) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero",
  products: "Products",
  content: "Content",
  social: "Social",
  layout: "Layout",
};

export function PresetBrowser({ onSelect, onClose }: PresetBrowserProps) {
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
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t("presetBrowser")}</h2>
            <p className="text-sm text-ink-soft">{t("presetBrowserDesc")}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-ink-soft hover:bg-rail hover:text-ink-soft">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-line px-6 py-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPresets")}
              className="w-full rounded-lg border border-line py-2 ps-10 pe-4 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedCategory ? "bg-primary-100 text-primary-700" : "bg-rail text-ink-soft hover:bg-rail"
              }`}
            >
              {t("all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat ? "bg-primary-100 text-primary-700" : "bg-rail text-ink-soft hover:bg-rail"
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredTypes.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-ink-soft">{t("noPresetsFound")}</div>
          ) : (
            <div className="space-y-6">
              {filteredTypes.map((def) => (
                <div key={def.type}>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{def.label}</h3>
                    <span className="rounded-full bg-rail px-2 py-0.5 text-xs text-ink-soft">{def.category}</span>
                    {def.limit && <span className="text-xs text-warning">Max {def.limit}</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleDefaultSelect(def.type)}
                      className="group rounded-lg border border-line p-3 text-start transition-all hover:border-primary-300 hover:shadow-sm"
                    >
                      <div className="mb-1 text-xs font-medium text-ink group-hover:text-primary-600">Default</div>
                      <div className="text-xs text-ink-soft line-clamp-2">{JSON.stringify(def.defaultSettings).slice(0, 60)}...</div>
                    </button>

                    {def.presets?.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(def.type, preset)}
                        className="group rounded-lg border border-line p-3 text-start transition-all hover:border-primary-300 hover:shadow-sm"
                      >
                        <div className="mb-1 flex items-center gap-1">
                          <Star className="h-3 w-3 text-warning" />
                          <span className="text-xs font-medium text-ink group-hover:text-primary-600">{preset.label}</span>
                        </div>
                        <div className="text-xs text-ink-soft line-clamp-2">{JSON.stringify(preset.settings).slice(0, 60)}...</div>
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
