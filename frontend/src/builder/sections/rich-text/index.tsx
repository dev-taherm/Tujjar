"use client";
import type { Section } from "@/shared/types";

export function RichTextPreview({ section }: { section: Section }) {
  const htmlContent = String(section.settings.htmlContent || "");
  const maxWidth = Number(section.settings.maxWidth) || 800;
  const alignment = String(section.settings.alignment || "left");
  return (
    <div className="py-8" style={{ maxWidth: `${maxWidth}px`, margin: alignment === "center" ? "0 auto" : undefined }}>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose prose-lg max-w-none" />
    </div>
  );
}
