"use client";
import type { Section } from "@/shared/types";

export function ImagePreview({ section }: { section: Section }) {
  const s = section.settings;
  const imageUrl = String(s.imageUrl || "");
  const altText = String(s.altText || "Image");
  const caption = String(s.caption || "");
  const alignment = String(s.alignment || "center");
  const maxWidth = Number(s.maxWidth) || 100;

  const alignClass: Record<string, string> = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
  };

  return (
    <div className="rounded-lg py-6 px-6" style={{ backgroundColor: "var(--color-surface)" }}>
      <div className={`${alignClass[alignment] || alignClass.center}`} style={{ maxWidth: `${maxWidth}%` }}>
        {imageUrl ? (
          <img src={imageUrl} alt={altText} className="w-full rounded-lg object-cover" />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-border)" }}>
            <div className="text-center" style={{ color: "var(--color-text-secondary)" }}>
              <svg className="mx-auto mb-2 h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-sm">Add an image URL</p>
            </div>
          </div>
        )}
        {caption && <p className="mt-2 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{caption}</p>}
      </div>
    </div>
  );
}
