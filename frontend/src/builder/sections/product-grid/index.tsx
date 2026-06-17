"use client";
import type { Section } from "@/shared/types";

export function ProductGridPreview({ section }: { section: Section }) {
  const title = String(section.settings.title || "");
  const cols = Number(section.settings.columns) || 4;
  return (
    <div className="py-8">
      {title && <h2 className="mb-6 text-2xl font-bold">{title}</h2>}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: Math.min(cols, 8) }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
            <div className="mb-3 aspect-square rounded-lg" style={{ background: "var(--color-surface)" }} />
            <div className="mb-2 h-4 w-3/4 rounded" style={{ background: "var(--color-surface)" }} />
            <div className="h-3 w-1/2 rounded" style={{ background: "var(--color-surface)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
