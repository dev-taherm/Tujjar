"use client";

import { LayoutTemplate } from "lucide-react";
import type { Template } from "@/shared/types";

interface TemplateThumbnailProps {
  template: Template;
  className?: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  fashion: "from-pink-500 to-purple-600",
  electronics: "from-blue-500 to-cyan-600",
  restaurant: "from-orange-500 to-red-600",
  pharmacy: "from-green-500 to-teal-600",
  furniture: "from-amber-500 to-yellow-600",
  general: "from-gray-500 to-slate-600",
};

export function TemplateThumbnail({ template, className = "" }: TemplateThumbnailProps) {
  if (template.thumbnail) {
    return (
      <img
        src={template.thumbnail}
        alt={template.name}
        className={`h-48 w-full rounded-t-xl object-cover ${className}`}
      />
    );
  }

  const gradient = CATEGORY_GRADIENTS[template.category] || CATEGORY_GRADIENTS.general;

  return (
    <div
      className={`flex h-48 w-full items-center justify-center rounded-t-xl bg-gradient-to-br ${gradient} ${className}`}
    >
      <div className="text-center text-white">
        <LayoutTemplate className="mx-auto h-12 w-12 opacity-80" />
        <p className="mt-2 text-sm font-medium opacity-90">{template.name}</p>
        <p className="text-xs capitalize opacity-70">{template.category}</p>
      </div>
    </div>
  );
}
