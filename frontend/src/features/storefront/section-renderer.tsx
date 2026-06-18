"use client";

import { sectionComponents } from "@/lib/section-registry";
import type { Section } from "@/shared/types";

function SectionFallback({ section }: { section: Section }) {
  return (
    <div className="rounded-lg border border-dashed p-4 sm:p-8 text-center text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
      {section.type} section
    </div>
  );
}

export function StorefrontSectionRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section) => {
        const vis = section.visibility;
        if (vis && !vis.desktop && !vis.tablet && !vis.mobile) return null;
        const Component = sectionComponents[section.type] || SectionFallback;
        const sectionStyle: React.CSSProperties = {};
        if (section.settings?.backgroundColor) {
          sectionStyle.backgroundColor = section.settings.backgroundColor as string;
        }
        if (section.settings?.paddingY != null) {
          const py = Math.min(Number(section.settings.paddingY) || 0, 80);
          sectionStyle.paddingTop = `${py}px`;
          sectionStyle.paddingBottom = `${py}px`;
        }
        if (section.settings?.paddingX != null) {
          const px = Math.min(Number(section.settings.paddingX) || 0, 40);
          sectionStyle.paddingLeft = `${px}px`;
          sectionStyle.paddingRight = `${px}px`;
        }
        return (
          <section
            key={section.id}
            className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8${section.className ? ` ${section.className}` : ""}`}
            style={Object.keys(sectionStyle).length ? sectionStyle : undefined}
          >
            {section.customCSS && (
              <style dangerouslySetInnerHTML={{ __html: `#${section.id} { ${section.customCSS} }` }} />
            )}
            <Component section={section} />
          </section>
        );
      })}
    </>
  );
}
