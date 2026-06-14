"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import { StorefrontSectionRenderer } from "@/features/storefront/section-renderer";
import { Button } from "@/shared/ui";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { Product, Section } from "@/shared/types";

interface StorefrontData {
  store: {
    name: string;
    slug: string;
    description: string;
    navigation: Record<string, unknown>;
    footer_config: Record<string, unknown>;
  };
  featured_products: Product[];
  homepage: {
    content_schema: { sections: Section[] };
    seo_title: string;
    seo_description: string;
  } | null;
}

export default function StorefrontHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const t = useTranslations("storefront.home");
  const tNotFound = useTranslations("storefront.notFound");

  const { data, isLoading } = useQuery<StorefrontData | null>({
    queryKey: ["storefront", slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/store/${slug}/`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-16">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-2xl animate-pulse">
              <div className="h-12 w-3/4 rounded bg-gray-200" />
              <div className="mt-6 h-6 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h1 className="text-2xl font-bold text-gray-900">{tNotFound("title")}</h1>
        <p className="mt-2 text-gray-500">{tNotFound("description")}</p>
        <Link href={`/${locale}`} className="mt-6">
          <Button>{tNotFound("goToTujjar")}</Button>
        </Link>
      </div>
    );
  }

  const store = data.store;
  const sections = data.homepage?.content_schema?.sections;
  const featuredProducts = data.featured_products || [];

  if (sections && sections.length > 0) {
    return (
      <div className="space-y-16 py-8">
        <StorefrontSectionRenderer sections={sections} />
        {featuredProducts.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{t("featuredProducts")}</h2>
              <Link href={`/${locale}/shop/${slug}/shop`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                {t("viewAll")}
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              {featuredProducts.map((product: Product) => (
                <StorefrontProductCard key={product.id} product={product} slug={slug} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              {store.name}
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              {t("discoverProducts")}
            </p>
            <div className="mt-8 flex gap-4">
              <Link href={`/${locale}/shop/${slug}/shop`}>
                <Button size="lg">
                  {t("shopNow")} <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t("featuredProducts")}</h2>
          <Link href={`/${locale}/shop/${slug}/shop`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            {t("viewAll")}
          </Link>
        </div>
        {featuredProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            {featuredProducts.map((product: Product) => (
              <StorefrontProductCard key={product.id} product={product} slug={slug} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            {t("noFeaturedProducts")}
          </div>
        )}
      </section>
    </div>
  );
}
