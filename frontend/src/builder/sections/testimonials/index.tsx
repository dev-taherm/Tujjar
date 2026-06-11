"use client";
import type { Section } from "@/shared/types";

export function TestimonialsPreview({ section }: { section: Section }) {
  const title = String(section.settings.title || "");
  const items = (section.settings.testimonials as Array<{ name: string; quote: string; rating: number }>) || [];
  return (
    <div className="py-8">
      {title && <h2 className="mb-6 text-2xl font-bold">{title}</h2>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-6">
            <p className="mb-4 text-gray-600 italic">&quot;{t.quote}&quot;</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div>
                <p className="font-medium">{t.name}</p>
                <div className="flex gap-0.5 text-yellow-400">
                  {Array.from({ length: t.rating || 5 }).map((_, j) => <span key={j}>&#9733;</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
