import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { StorefrontSectionRenderer } from "@/features/storefront/section-renderer";
import { Button } from "@/shared/ui";
import {
  getStorePage,
  storefrontUrl,
} from "@/lib/server/storefront-api";
import { collectThemeVars } from "@/lib/theme-css";
import type { Section, ThemeOverride } from "@/shared/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>;
}): Promise<Metadata> {
  const { slug, pageSlug } = await params;
  const locale = await getLocale();
  const page = await getStorePage(slug, pageSlug, locale);
  if (!page) return {};

  const title = page.seo_title || page.title;
  const description = page.seo_description || "";
  return {
    title: page.seo_title ? { absolute: page.seo_title } : title,
    description,
    alternates: { canonical: storefrontUrl(slug, pageSlug, locale) },
    openGraph: {
      title,
      description,
      url: storefrontUrl(slug, pageSlug, locale),
    },
  };
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>;
}) {
  const { slug, pageSlug } = await params;
  const locale = await getLocale();
  const tNotFound = await getTranslations({ locale, namespace: "storefront.pageNotFound" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const page = await getStorePage(slug, pageSlug, locale);

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{tNotFound("title")}</h1>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>{tNotFound("description")}</p>
        <Link href={`/${locale}/shop/${slug}`} className="mt-6">
          <Button>{tCommon("backToStore")}</Button>
        </Link>
      </div>
    );
  }

  const sections = (page.content_schema?.sections || []) as unknown as Section[];

  return (
    <>
      {/* Page-level theme override — rendered after the layout's theme style
          tag, so its declarations take precedence (same selector, later wins). */}
      {page.theme_override ? (
        <ThemeOverrideStyle override={page.theme_override as ThemeOverride} />
      ) : null}
      <div className="py-8">
        <StorefrontSectionRenderer sections={sections} />
        {sections.length === 0 && (
          <div className="mx-auto max-w-3xl px-4 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {page.title}
          </div>
        )}
      </div>
    </>
  );
}

function ThemeOverrideStyle({ override }: { override: ThemeOverride }) {
  const vars = collectThemeVars(override, false);
  if (Object.keys(vars).length === 0) return null;
  const css = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  return <style dangerouslySetInnerHTML={{ __html: `:root {\n${css}\n}` }} />;
}
