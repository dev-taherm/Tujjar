import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import { ProductListControls } from "@/features/storefront/product-list-controls";
import {
  getStore,
  getStoreProductsPage,
  storefrontUrl,
} from "@/lib/server/storefront-api";
import type { Product } from "@/shared/types";
import type { StorefrontProduct } from "@/lib/server/storefront-api";

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
  searchParams: Promise<{ sort?: string; search?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { sort = "-created_at", search = "", page = "1" } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "storefront.products" });

  const validPage = Math.max(1, Number(page) || 1);
  const result = await getStoreProductsPage(slug, locale, {
    sort: VALID_SORTS.has(sort) ? sort : "-created_at",
    search,
    page: validPage,
  });

  const products = result?.results ?? [];
  const totalPages = result?.total_pages ?? 1;
  const currentPage = result?.current_page ?? 1;

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
        <>
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product: StorefrontProduct) => (
              <StorefrontProductCard key={product.id} product={product as unknown as Product} slug={slug} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              base={`/${locale}/shop/${slug}/shop`}
              sort={sort}
              search={search}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          )}
        </>
      )}
    </div>
  );
}

function Pagination({
  base,
  sort,
  search,
  currentPage,
  totalPages,
}: {
  base: string;
  sort: string;
  search: string;
  currentPage: number;
  totalPages: number;
}) {
  const qs = (page: number) => {
    const sp = new URLSearchParams();
    if (sort && sort !== "-created_at") sp.set("sort", sort);
    if (search) sp.set("search", search);
    if (page > 1) sp.set("page", String(page));
    const s = sp.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-2"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {currentPage > 1 ? (
        <a
          href={qs(currentPage - 1)}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          ←
        </a>
      ) : (
        <span className="rounded-lg border px-4 py-2 text-sm opacity-40" style={{ borderColor: "var(--color-border)" }}>
          ←
        </span>
      )}
      <span className="px-2 text-sm">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages ? (
        <a
          href={qs(currentPage + 1)}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          →
        </a>
      ) : (
        <span className="rounded-lg border px-4 py-2 text-sm opacity-40" style={{ borderColor: "var(--color-border)" }}>
          →
        </span>
      )}
    </nav>
  );
}
