"use client";
import type { Section } from "@/shared/types";

export function CustomHtmlPreview({ section }: { section: Section }) {
  const htmlContent = String(section.settings.htmlContent || "<div>Custom HTML</div>");

  return (
    <div className="rounded-lg" style={{ backgroundColor: "var(--color-surface)" }}>
      <div className="prose prose-sm max-w-none p-6" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      <div className="border-t px-6 py-2 text-center text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
        Custom HTML
      </div>
    </div>
  );
}
