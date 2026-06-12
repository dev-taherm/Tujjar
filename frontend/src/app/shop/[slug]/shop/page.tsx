"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import type { Product } from "@/shared/types";

const sortOptions = [
  { value: "-created_at", label: "Newest" },
  { value: "name", label: "Name A-Z" },
  { value: "-name", label: "Name Z-A" },
  { value: "price", label: "Price Low-High" },
  { value: "-price", label: "Price High-Low" },
];

export default function StorefrontProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [sort, setSort] = useState("-created_at");
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["storefront", slug, "products", sort, search],
    queryFn: async () => {
      const sp = new URLSearchParams({ sort });
      if (search) sp.set("search", search);
      const res = await fetch(`/api/v1/store/${slug}/products/?${sp}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
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
          No products available yet.
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
