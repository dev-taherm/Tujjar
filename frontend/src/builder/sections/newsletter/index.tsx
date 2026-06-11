"use client";
import type { Section } from "@/shared/types";

export function NewsletterPreview({ section }: { section: Section }) {
  const title = String(section.settings.title || "");
  const subtitle = String(section.settings.subtitle || "");
  const placeholder = String(section.settings.placeholder || "Enter your email");
  const buttonText = String(section.settings.buttonText || "Subscribe");
  const privacyText = String(section.settings.privacyText || "");
  return (
    <div className="rounded-lg bg-gray-50 py-12 px-8 text-center">
      {title && <h2 className="mb-2 text-2xl font-bold">{title}</h2>}
      {subtitle && <p className="mb-6 text-gray-600">{subtitle}</p>}
      <div className="mx-auto flex max-w-md gap-2">
        <input type="email" placeholder={placeholder} className="flex-1 rounded-lg border border-gray-300 px-4 py-3" />
        <button className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700">{buttonText}</button>
      </div>
      {privacyText && <p className="mt-3 text-xs text-gray-500">{privacyText}</p>}
    </div>
  );
}
