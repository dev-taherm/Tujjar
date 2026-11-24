import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ProductPurchasePanel } from "@/features/storefront/purchase-panel";
import { ProductGallery } from "@/features/storefront/product-gallery";
import { ProductReviews } from "@/features/storefront/product-reviews";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import {
  getStore,
  getStoreProduct,
  getStoreProductRelated,
  storefrontUrl,
} from "@/lib/server/storefront-api";
import type { Product } from "@/shared/types";

function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const locale = await getLocale();
  const product = await getStoreProduct(slug, productSlug, locale);
  if (!product) return {};

  const title = product.seo_title || product.title;
  const description = product.seo_description || product.description || "";
  const images = product.primary_image?.url ? [product.primary_image.url] : [];

  return {
    // When the product carries a complete seo_title it already includes the
    // store suffix — mark it absolute so the layout template isn't applied twice.
    title: product.seo_title ? { absolute: product.seo_title } : title,
    description,
    alternates: { canonical: storefrontUrl(slug, `shop/${productSlug}`, locale) },
    openGraph: {
      title,
      description,
      url: storefrontUrl(slug, `shop/${productSlug}`, locale),
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function StorefrontProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "storefront.product" });
  const tProducts = await getTranslations({ locale, namespace: "storefront.products" });

  const [product, store, relatedProducts] = await Promise.all([
    getStoreProduct(slug, productSlug, locale),
    getStore(slug, locale),
    getStoreProductRelated(slug, productSlug, locale),
  ]);

  if (!product) {
    return <div className="py-16 text-center text-gray-500">{t("notFound")}</div>;
  }

  const tRelated = await getTranslations({ locale, namespace: "storefront.related" });
  const images = (product.images ?? []).filter((img) => img?.url);
  const primary = product.primary_image;
  if (primary?.url && !images.some((i) => i.url === primary.url)) {
    images.unshift(primary);
  }

  const pageUrl = storefrontUrl(slug, `shop/${productSlug}`, locale);
  const shopUrl = storefrontUrl(slug, "shop", locale);
  const price = Number(product.price) || 0;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || "",
    image: product.primary_image?.url ? [product.primary_image.url] : undefined,
    sku: product.id,
    brand: store ? { "@type": "Brand", name: store.name } : undefined,
    offers: {
      "@type": "Offer",
      url: pageUrl,
      price: price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: store?.name || "Home", item: storefrontUrl(slug, "", locale) },
      { "@type": "ListItem", position: 2, name: tProducts("allProducts"), item: shopUrl },
      { "@type": "ListItem", position: 3, name: product.title, item: pageUrl },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${locale}/shop/${slug}`} className="hover:underline">{store?.name || "Home"}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/${locale}/shop/${slug}/shop`} className="hover:underline">{tProducts("allProducts")}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" style={{ color: "var(--color-text)" }}>{product.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductGallery images={images} alt={product.title} />
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{product.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>${product.price}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-lg text-gray-400 line-through">${product.compare_at_price}</span>
              )}
            </div>
          </div>
          <p className="text-gray-600">{product.description}</p>
          <ProductPurchasePanel product={product} slug={slug} />
        </div>
      </div>

      <ProductReviews productId={product.id} productSlug={productSlug} storeSlug={slug} />

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
            {tRelated("title")}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4">
            {relatedProducts.map((related) => (
              <StorefrontProductCard
                key={related.id}
                product={related as unknown as Product}
                slug={slug}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
