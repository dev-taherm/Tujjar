"use client";
import { useState } from "react";
import type { Section } from "@/shared/types";

interface CarouselImage {
  url: string;
  alt: string;
}

const placeholderColors = ["#e74c3c", "#3498db", "#2ecc71"];

export function CarouselPreview({ section }: { section: Section }) {
  const s = section.settings;
  const title = String(s.title || "");
  const images = (s.images as CarouselImage[]) || [];
  const showDots = s.showDots !== false;
  const showArrows = s.showArrows !== false;
  const autoplay = Boolean(s.autoplay);
  const [current, setCurrent] = useState(0);

  const items = images.length > 0 ? images : [];
  const total = items.length || placeholderColors.length;

  const next = () => setCurrent((c) => (c + 1) % total);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  return (
    <div className="rounded-lg py-8 px-6" style={{ backgroundColor: "var(--color-surface)" }}>
      {title && <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>}
      <div className="relative overflow-hidden rounded-lg">
        {showArrows && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-sm font-bold shadow hover:bg-white" style={{ color: "var(--color-text)" }}>&#8249;</button>
            <button onClick={next} className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-sm font-bold shadow hover:bg-white" style={{ color: "var(--color-text)" }}>&#8250;</button>
          </>
        )}
        <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${current * 100}%)` }}>
          {items.length > 0
            ? items.map((img, i) => (
                <div key={i} className="min-w-full">
                  <img src={img.url} alt={img.alt || ""} className="h-64 w-full object-cover" />
                </div>
              ))
            : placeholderColors.map((color, i) => (
                <div key={i} className="min-w-full">
                  <div className="flex h-64 w-full items-center justify-center" style={{ backgroundColor: color }}>
                    <span className="text-white text-lg font-medium">Slide {i + 1}</span>
                  </div>
                </div>
              ))}
        </div>
      </div>
      {showDots && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-2.5 w-2.5 rounded-full transition-colors"
              style={{ backgroundColor: i === current ? "var(--color-primary)" : "var(--color-border)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
