"use client";
import { useMemo } from "react";
import DOMPurify from "dompurify";
import type { Section } from "@/shared/types";

export function RichTextPreview({ section }: { section: Section }) {
  const htmlContent = String(section.settings.htmlContent || "");
  const maxWidth = Number(section.settings.maxWidth) || 800;
  const alignment = String(section.settings.alignment || "left");

  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(htmlContent, { ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "img", "blockquote", "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "span", "div", "hr"] }),
    [htmlContent]
  );

  return (
    <div className="py-8" style={{ maxWidth: `${maxWidth}px`, margin: alignment === "center" ? "0 auto" : undefined }}>
      <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} className="prose prose-lg max-w-none" />
    </div>
  );
}
