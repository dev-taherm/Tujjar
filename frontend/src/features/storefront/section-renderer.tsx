"use client";

import { sectionComponents } from "@/lib/section-registry";
import type { Section } from "@/shared/types";

function SectionFallback({ section }: { section: Section }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
      {section.type} section
    </div>
  );
}

export function StorefrontSectionRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section) => {
        if (section.visibility && !section.visibility.desktop) return null;
        const Component = sectionComponents[section.type] || SectionFallback;
        return (
          <section key={section.id} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Component section={section} />
          </section>
        );
      })}
    </>
  );
}
