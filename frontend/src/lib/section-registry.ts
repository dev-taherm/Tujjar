import { HeroPreview } from "@/builder/sections/hero";
import { ProductGridPreview } from "@/builder/sections/product-grid";
import { GalleryPreview } from "@/builder/sections/gallery";
import { TestimonialsPreview } from "@/builder/sections/testimonials";
import { FaqPreview } from "@/builder/sections/faq";
import { RichTextPreview } from "@/builder/sections/rich-text";
import { BannerPreview } from "@/builder/sections/banner";
import { NewsletterPreview } from "@/builder/sections/newsletter";
import { CountdownPreview } from "@/builder/sections/countdown";
import { CustomHtmlPreview } from "@/builder/sections/custom-html";
import { VideoPreview } from "@/builder/sections/video";
import { ImagePreview } from "@/builder/sections/image";
import { PricingPreview } from "@/builder/sections/pricing";
import { ContactPreview } from "@/builder/sections/contact";
import { CarouselPreview } from "@/builder/sections/carousel";
import { FooterPreview } from "@/builder/sections/footer";
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
  countdown: CountdownPreview,
  "custom-html": CustomHtmlPreview,
  video: VideoPreview,
  image: ImagePreview,
  pricing: PricingPreview,
  contact: ContactPreview,
  carousel: CarouselPreview,
  footer: FooterPreview,
};
