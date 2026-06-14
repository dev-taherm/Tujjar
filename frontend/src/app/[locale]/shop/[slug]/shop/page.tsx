"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import { useTranslations, useLocale } from "next-intl";
import type { Product } from "@/shared/types";

export default function StorefrontProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const t = useTranslations("storefront.products");
  const [sort, setSort] = useState("-created_at");
  const [search, setSearch] = useState("");

  const sortOptions = [
    { value: "-created_at", label: t("sortNewest") },
    { value: "name", label: t("sortNameAZ") },
    { value: "-name", label: t("sortNameZA") },
    { value: "price", label: t("sortPriceLowHigh") },
    { value: "-price", label: t("sortPriceHighLow") },
  ];

  const { data: products, isLoading } = useQuery({
    queryKey: ["storefront", slug, "products", sort, search, locale],
    queryFn: async () => {
      const sp = new URLSearchParams({ sort, locale });
      if (search) sp.set("search", search);
      const res = await fetch(`/api/v1/store/${slug}/products/?${sp}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("allProducts")}</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : !products?.length ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          {t("noProducts")}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p: Product) => (
            <StorefrontProductCard key={p.id} product={p} slug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}
