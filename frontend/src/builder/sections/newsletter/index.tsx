"use client";
import type { Section } from "@/shared/types";

export function NewsletterPreview({ section }: { section: Section }) {
  const title = String(section.settings.title || "");
  const subtitle = String(section.settings.subtitle || "");
  const placeholder = String(section.settings.placeholder || "Enter your email");
  const buttonText = String(section.settings.buttonText || "Subscribe");
  const privacyText = String(section.settings.privacyText || "");
  return (
    <div className="rounded-lg py-12 px-8 text-center" style={{ backgroundColor: "var(--color-surface)" }}>
      {title && <h2 className="mb-2 text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{title}</h2>}
      {subtitle && <p className="mb-6" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>}
      <div className="mx-auto flex max-w-md gap-2">
        <input type="email" placeholder={placeholder} className="flex-1 rounded-lg border px-4 py-3" style={{ borderColor: "var(--color-border)" }} />
        <button className="rounded-lg px-6 py-3 text-white font-medium hover:opacity-90" style={{ backgroundColor: "var(--color-primary)" }}>{buttonText}</button>
      </div>
      {privacyText && <p className="mt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>{privacyText}</p>}
    </div>
  );
}
