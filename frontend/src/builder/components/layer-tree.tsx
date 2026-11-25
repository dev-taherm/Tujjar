"use client";

import { Eye, EyeOff } from "lucide-react";
import type { Section } from "@/shared/types";

interface LayerTreeProps {
  sections: Section[];
  selectedSectionId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (sectionId: string, device: string) => void;
  device: "desktop" | "tablet" | "mobile";
}

const categoryColors: Record<string, string> = {
  hero: "bg-primary-500",
  products: "bg-purple-500",
  content: "bg-success",
  social: "bg-warning",
  layout: "bg-ink-soft",
};

export function LayerTree({
  sections,
  selectedSectionId,
  onSelect,
  onToggleVisibility,
  device,
}: LayerTreeProps) {
  const getLabel = (section: Section) => {
    const title = section.settings?.title;
    if (typeof title === "string" && title.trim()) return title;
    return section.type;
  };

  const getCategory = (type: string) => {
    if (type === "hero") return "hero";
    if (type === "product-grid") return "products";
    if (["gallery", "rich-text", "banner", "newsletter", "custom-html", "countdown", "video", "image", "pricing", "contact", "carousel", "faq"].includes(type)) return "content";
    if (type === "testimonials") return "social";
    if (type === "footer") return "layout";
    return "content";
  };

  return (
    <div className="divide-y divide-line">
      {sections.map((section) => {
        const isVisible = section.visibility?.[device] ?? true;
        const isSelected = section.id === selectedSectionId;
        const cat = getCategory(section.type);
        const dotColor = categoryColors[cat] ?? "bg-ink-soft";

        return (
          <div
            key={section.id}
            onClick={() => onSelect(section.id)}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-rail ${
              isSelected ? "bg-primary-50" : ""
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(section.id, device);
              }}
              className="shrink-0 text-ink-soft hover:text-ink-soft"
            >
              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>

            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />

            <span className="flex-1 truncate text-sm text-ink">
              {getLabel(section)}
            </span>

            <span className="shrink-0 text-[10px] font-medium text-ink-soft">
              {section.type}
            </span>
          </div>
        );
      })}
    </div>
  );
}
