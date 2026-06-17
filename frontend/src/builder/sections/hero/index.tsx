"use client";

import type { Section } from "@/shared/types";

export function HeroPreview({ section }: { section: Section }) {
  const s = section.settings;
  const title = String(s.title || "");
  const subtitle = String(s.subtitle || "");
  const buttonText = String(s.buttonText || "");
  const buttonLink = String(s.buttonLink || "");
  const backgroundImage = String(s.backgroundImage || "");
  const overlayOpacity = Number(s.overlayOpacity) || 0.4;
  const alignment = String(s.alignment || "center");
  const textColor = String(s.textColor || "#ffffff");
  const minHeight = Number(s.minHeight) || 500;

  const alignMap: Record<string, string> = { left: "items-start text-start", center: "items-center text-center", right: "items-end text-end" };

  return (
    <div
      className={`relative flex flex-col justify-center rounded-lg ${alignMap[alignment] || alignMap.center}`}
      style={{ minHeight: `${minHeight}px`, backgroundColor: "var(--color-primary)", backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {backgroundImage && <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />}
      <div className="relative z-10 px-8 py-16">
        <h1 className="mb-4 text-4xl font-bold" style={{ color: textColor, fontFamily: "var(--font-heading)" }}>{title}</h1>
        {subtitle && <p className="mb-6 text-lg opacity-90" style={{ color: textColor }}>{subtitle}</p>}
        {buttonText && <a href={buttonLink} className="inline-block rounded-lg bg-[var(--color-primary)] px-6 py-3 text-white font-medium hover:opacity-90">{buttonText}</a>}
      </div>
    </div>
  );
}
