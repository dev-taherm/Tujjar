"use client";

import { useState } from "react";
import { getAllSectionTypes } from "@/builder/sections/registry";
import type { SectionDefinition } from "@/shared/types";
import * as Icons from "lucide-react";
import { X, Search } from "lucide-react";

interface SectionTypePickerProps {
  onSelect: (type: string) => void;
  onClose: () => void;
}

const categories = ["hero", "products", "content", "social", "layout"] as const;
const categoryLabels: Record<string, string> = {
  hero: "Hero",
  products: "Products",
  content: "Content",
  social: "Social Proof",
  layout: "Layout",
};

export function SectionTypePicker({ onSelect, onClose }: SectionTypePickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const allTypes = getAllSectionTypes();

  const filtered = allTypes.filter((def) => {
    const matchesSearch = !search || def.label.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || def.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Box;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Add Section</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                activeCategory === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
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

        <div className="max-h-96 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No sections found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((def: SectionDefinition) => {
                const Icon = getIcon(def.icon);
                return (
                  <button
                    key={def.type}
                    onClick={() => { onSelect(def.type); onClose(); }}
                    className="group flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Icon className="h-8 w-8 text-gray-400 group-hover:text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{def.label}</p>
                      <p className="text-xs text-gray-500 capitalize">{def.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
