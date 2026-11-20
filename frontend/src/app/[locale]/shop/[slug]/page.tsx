import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import { StorefrontSectionRenderer } from "@/features/storefront/section-renderer";
import { Button } from "@/shared/ui";
import { getStoreHome, resolveSeoTitle, storefrontUrl } from "@/lib/server/storefront-api";
import type { Product, Section } from "@/shared/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const data = await getStoreHome(slug, locale);
  if (!data) return {};

  const { store, homepage } = data;
  const title =
    homepage?.seo_title || resolveSeoTitle(store.seo_title, "Home", store.name) || store.name;
  const description = homepage?.seo_description || store.seo_description || store.description || "";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: storefrontUrl(slug, "", locale) },
    openGraph: {
      title,
      description,
      url: storefrontUrl(slug, "", locale),
      images: store.og_image ? [store.og_image] : [],
    },
  };
}

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "storefront.home" });
  const tNotFound = await getTranslations({ locale, namespace: "storefront.notFound" });

  const data = await getStoreHome(slug, locale);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{tNotFound("title")}</h1>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>{tNotFound("description")}</p>
        <Link href={`/${locale}`} className="mt-6">
          <Button>{tNotFound("goToTujjar")}</Button>
        </Link>
      </div>
    );
  }

  const { store, homepage, featured_products } = data;
  const sections = (homepage?.content_schema?.sections ?? []) as unknown as Section[];
  const featuredProducts = featured_products || [];
  const shopHref = `/${locale}/shop/${slug}/shop`;

  if (sections && sections.length > 0) {
    return (
      <div className="space-y-16 py-8">
        <StorefrontSectionRenderer sections={sections} />
        {featuredProducts.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{t("featuredProducts")}</h2>
              <Link href={shopHref} className="text-sm font-medium underline-offset-4 hover:underline" style={{ color: "var(--color-primary)" }}>
                {t("viewAll")}
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              {featuredProducts.map((product) => (
                <StorefrontProductCard key={product.id} product={product as unknown as Product} slug={slug} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(to bottom right, var(--color-surface), var(--color-bg), var(--color-surface))" }}>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: "var(--color-text)" }}>
              {store.name}
            </h1>
            {store.description && (
              <p className="mt-6 text-lg" style={{ color: "var(--color-text-secondary)" }}>
                {store.description}
              </p>
            )}
            {!store.description && (
              <p className="mt-6 text-lg" style={{ color: "var(--color-text-secondary)" }}>
                {t("discoverProducts")}
              </p>
            )}
            <div className="mt-8 flex gap-4">
              <Link href={shopHref}>
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
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{t("featuredProducts")}</h2>
          <Link href={shopHref} className="text-sm font-medium underline-offset-4 hover:underline" style={{ color: "var(--color-primary)" }}>
            {t("viewAll")}
          </Link>
        </div>
        {featuredProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <StorefrontProductCard key={product.id} product={product as unknown as Product} slug={slug} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed p-12 text-center" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            {t("noFeaturedProducts")}
          </div>
        )}
      </section>
    </div>
  );
}
