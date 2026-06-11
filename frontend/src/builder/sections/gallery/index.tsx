"use client";
import type { Section } from "@/shared/types";

export function GalleryPreview({ section }: { section: Section }) {
  const title = String(section.settings.title || "");
  const cols = Number(section.settings.columns) || 3;
  return (
    <div className="py-8">
      {title && <h2 className="mb-6 text-2xl font-bold">{title}</h2>}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
