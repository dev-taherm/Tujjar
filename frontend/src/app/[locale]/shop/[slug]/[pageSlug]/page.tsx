"use client";

import { use, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { StorefrontSectionRenderer } from "@/features/storefront/section-renderer";
import { Button } from "@/shared/ui";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { applyThemeVariables } from "@/lib/theme-css";
import type { Section, ThemeOverride } from "@/shared/types";

interface PageData {
  id: string;
  title: string;
  slug: string;
  content_schema: { sections: Section[] };
  seo_title: string;
  seo_description: string;
  theme_override: ThemeOverride | null;
}

export default function StorefrontPage({ params }: { params: Promise<{ slug: string; pageSlug: string }> }) {
  const { slug, pageSlug } = use(params);
  const locale = useLocale();
  const tNotFound = useTranslations("storefront.pageNotFound");
  const tCommon = useTranslations("common");

  const { data, isLoading } = useQuery<PageData | null>({
    queryKey: ["storefront-page", slug, pageSlug, locale],
    queryFn: async () => {
      const res = await fetch(`/api/v1/store/${slug}/pages/${pageSlug}/?locale=${locale}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Apply page-level theme override (layered on top of store theme from layout)
  useEffect(() => {
    if (data?.theme_override) {
      applyThemeVariables(data.theme_override);
    }
  }, [data?.theme_override]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h1 className="text-2xl font-bold text-gray-900">{tNotFound("title")}</h1>
        <p className="mt-2 text-gray-500">{tNotFound("description")}</p>
        <Link href={`/${locale}/shop/${slug}`} className="mt-6">
          <Button>{tCommon("backToStore")}</Button>
        </Link>
      </div>
    );
  }

  const sections = data.content_schema?.sections || [];

  return (
    <div className="space-y-8 py-8">
      {sections.length > 0 ? (
        <StorefrontSectionRenderer sections={sections} />
      ) : (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
        </div>
      )}
    </div>
  );
}
