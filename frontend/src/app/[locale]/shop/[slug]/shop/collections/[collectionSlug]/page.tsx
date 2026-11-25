import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import {
  getStore,
  getStoreCollections,
  getStoreProducts,
  storefrontUrl,
} from "@/lib/server/storefront-api";
import type { Product } from "@/shared/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; collectionSlug: string }>;
}): Promise<Metadata> {
  const { slug, collectionSlug } = await params;
  const locale = await getLocale();
  const collections = await getStoreCollections(slug, locale);
  const collection = collections.find((c) => c.slug === collectionSlug);
  const store = await getStore(slug, locale);

  const title = collection?.name || "Collection";
  const description = collection?.description || store?.seo_description || "";
  return {
    title,
    description,
    alternates: { canonical: storefrontUrl(slug, `shop/collections/${collectionSlug}`, locale) },
  };
}

export default async function StorefrontCollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string; collectionSlug: string }>;
}) {
  const { slug, collectionSlug } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "storefront.products" });
  const tCollections = await getTranslations({ locale, namespace: "storefront.collections" });

  const [collections, store] = await Promise.all([
    getStoreCollections(slug, locale),
    getStore(slug, locale),
  ]);
  const collection = collections.find((c) => c.slug === collectionSlug);

  const products = await getStoreProducts(slug, locale, { collection: collectionSlug });

  return (
    <div className="mx-auto max-w-[var(--container-max-width,80rem)] px-4 py-8 sm:px-6 lg:px-8">
      <JsonLdBreadcrumbs
        slug={slug}
        locale={locale}
        storeName={store?.name || "Home"}
        collectionName={collection?.name || collectionSlug}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${locale}/shop/${slug}`} className="hover:underline">{store?.name || "Home"}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/${locale}/shop/${slug}/shop/collections`} className="hover:underline">{tCollections("title")}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" style={{ color: "var(--color-text)" }}>{collection?.name || collectionSlug}</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{collection?.name || collectionSlug}</h1>
      {collection?.description && (
        <p className="mt-2 max-w-2xl" style={{ color: "var(--color-text-secondary)" }}>{collection.description}</p>
      )}

      {products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-12 text-center" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          {t("noProducts")}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <StorefrontProductCard key={product.id} product={product as unknown as Product} slug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}

function JsonLdBreadcrumbs({
  slug,
  locale,
  storeName,
  collectionName,
}: {
  slug: string;
  locale: string;
  storeName: string;
  collectionName: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: storeName, item: storefrontUrl(slug, "", locale) },
      { "@type": "ListItem", position: 2, name: "Collections", item: storefrontUrl(slug, "shop/collections", locale) },
      { "@type": "ListItem", position: 3, name: collectionName },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
