"use client";
import type { Section } from "@/shared/types";

interface FooterColumn {
  title: string;
  links: Array<{ label: string; url: string }>;
}

export function FooterPreview({ section }: { section: Section }) {
  const s = section.settings;
  const columns = (s.columns as FooterColumn[]) || [];
  const copyright = String(s.copyright || "");
  const socialLinks = (s.socialLinks as Record<string, string>) || {};

  const socialLabels: Record<string, string> = {
    facebook: "f",
    twitter: "X",
    instagram: "ig",
    youtube: "yt",
  };

  return (
    <footer className="rounded-lg py-10 px-8" style={{ backgroundColor: "var(--color-text)", color: "var(--color-surface)" }}>
      <div className="grid gap-8 md:grid-cols-4">
        {columns.map((col, i) => (
          <div key={i}>
            <h4 className="mb-4 text-sm font-semibold uppercase" style={{ color: "var(--color-surface)" }}>{col.title}</h4>
            <ul className="space-y-2">
              {(col.links || []).map((link, j) => (
                <li key={j}>
                  <a href={link.url} className="text-sm opacity-70 hover:opacity-100" style={{ color: "var(--color-surface)" }}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {Object.keys(socialLinks).length > 0 && (
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase" style={{ color: "var(--color-surface)" }}>Follow Us</h4>
            <div className="flex gap-3">
              {Object.entries(socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium opacity-70 hover:opacity-100"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "var(--color-surface)" }}
                >
                  {socialLabels[platform] || platform[0]}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      {copyright && (
        <div className="mt-8 border-t pt-6 text-center text-xs opacity-60" style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-surface)" }}>
          {copyright}
        </div>
      )}
    </footer>
  );
}
