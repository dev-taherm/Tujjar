import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getStore, getStoreCollections, storefrontUrl } from "@/lib/server/storefront-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const store = await getStore(slug, locale);
  const t = await getTranslations({ locale, namespace: "storefront.collections" });
  return {
    title: t("title"),
    description: store?.seo_description || store?.description || "",
    alternates: { canonical: storefrontUrl(slug, "shop/collections", locale) },
  };
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "storefront.collections" });

  const collections = await getStoreCollections(slug, locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{t("title")}</h1>
      {collections.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-12 text-center" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          {t("noCollections")}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/${locale}/shop/${slug}/shop/collections/${collection.slug}`}
              className="group overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <div className="aspect-video overflow-hidden" style={{ background: "var(--color-bg)" }}>
                {collection.image_url ? (
                  <img
                    src={collection.image_url}
                    alt={collection.name}
                    width={600}
                    height={340}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
                    {t("title")}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold" style={{ color: "var(--color-text)" }}>{collection.name}</h2>
                {collection.description && (
                  <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {collection.description}
                  </p>
                )}
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {t("productsCount", { count: collection.products_count })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
