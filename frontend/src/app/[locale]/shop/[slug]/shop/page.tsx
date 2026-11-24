import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import { ProductListControls } from "@/features/storefront/product-list-controls";
import { getStore, getStoreProducts, storefrontUrl } from "@/lib/server/storefront-api";
import type { Product } from "@/shared/types";

const VALID_SORTS = new Set(["name", "-name", "price", "-price", "created_at", "-created_at"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const store = await getStore(slug, locale);
  const title = store ? `${store.name} — Products` : "Products";
  const description = store?.seo_description || store?.description || "";
  return {
    title,
    description,
    alternates: { canonical: storefrontUrl(slug, "shop", locale) },
  };
}

export default async function StorefrontProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; search?: string }>;
}) {
  const { slug } = await params;
  const { sort = "-created_at", search = "" } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "storefront.products" });

  const products = await getStoreProducts(slug, locale, {
    sort: VALID_SORTS.has(sort) ? sort : "-created_at",
    search,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{t("allProducts")}</h1>
        <ProductListControls key={`${sort}-${search}`} sort={sort} currentSearch={search} />
      </div>
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
