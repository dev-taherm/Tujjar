"use client";

import { HeroPreview } from "@/builder/sections/hero";
import { ProductGridPreview } from "@/builder/sections/product-grid";
import { GalleryPreview } from "@/builder/sections/gallery";
import { TestimonialsPreview } from "@/builder/sections/testimonials";
import { FaqPreview } from "@/builder/sections/faq";
import { RichTextPreview } from "@/builder/sections/rich-text";
import { BannerPreview } from "@/builder/sections/banner";
import { NewsletterPreview } from "@/builder/sections/newsletter";
import type { Section } from "@/shared/types";

const sectionComponents: Record<string, React.ComponentType<{ section: Section }>> = {
  hero: HeroPreview,
  "product-grid": ProductGridPreview,
  gallery: GalleryPreview,
  testimonials: TestimonialsPreview,
  faq: FaqPreview,
  "rich-text": RichTextPreview,
  banner: BannerPreview,
  newsletter: NewsletterPreview,
};

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
