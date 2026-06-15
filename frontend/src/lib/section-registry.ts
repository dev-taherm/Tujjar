import { HeroPreview } from "@/builder/sections/hero";
import { ProductGridPreview } from "@/builder/sections/product-grid";
import { GalleryPreview } from "@/builder/sections/gallery";
import { TestimonialsPreview } from "@/builder/sections/testimonials";
import { FaqPreview } from "@/builder/sections/faq";
import { RichTextPreview } from "@/builder/sections/rich-text";
import { BannerPreview } from "@/builder/sections/banner";
import { NewsletterPreview } from "@/builder/sections/newsletter";
import type { Section } from "@/shared/types";

export const sectionComponents: Record<string, React.ComponentType<{ section: Section }>> = {
  hero: HeroPreview,
  "product-grid": ProductGridPreview,
  gallery: GalleryPreview,
  testimonials: TestimonialsPreview,
  faq: FaqPreview,
  "rich-text": RichTextPreview,
  banner: BannerPreview,
  newsletter: NewsletterPreview,
};
