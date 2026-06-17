"use client";
import type { Section } from "@/shared/types";

export function BannerPreview({ section }: { section: Section }) {
  const title = String(section.settings.title || "");
  const subtitle = String(section.settings.subtitle || "");
  const backgroundImage = String(section.settings.backgroundImage || "");
  const buttonText = String(section.settings.buttonText || "");
  const buttonLink = String(section.settings.buttonLink || "");
  const textColor = String(section.settings.textColor || "#ffffff");
  const backgroundColor = String(section.settings.backgroundColor || "var(--color-primary)");
  return (
    <div className="rounded-lg py-12 px-8 text-center" style={{ backgroundColor, backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined, backgroundSize: "cover" }}>
      <h2 className="mb-2 text-3xl font-bold" style={{ color: textColor, fontFamily: "var(--font-heading)" }}>{title}</h2>
      {subtitle && <p className="mb-6 text-lg opacity-90" style={{ color: textColor }}>{subtitle}</p>}
      {buttonText && <a href={buttonLink} className="inline-block rounded-lg bg-white px-6 py-3 font-medium hover:bg-gray-100" style={{ color: "var(--color-text)" }}>{buttonText}</a>}
    </div>
  );
}
