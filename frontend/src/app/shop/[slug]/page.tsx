"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import { Button } from "@/shared/ui";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/shared/types";

export default function StorefrontHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data, isLoading } = useQuery({
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
        <h1 className="text-2xl font-bold text-gray-900">Store not found</h1>
        <p className="mt-2 text-gray-500">This store doesn't exist or is no longer available.</p>
        <Link href="/" className="mt-6">
          <Button>Go to Tujjar</Button>
        </Link>
      </div>
    );
  }

  const store = data.store;
  const featuredProducts = data.featured_products || [];

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              {store.name}
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Discover our curated collection of products. Quality, style, and innovation.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href={`/shop/${slug}/shop`}>
                <Button size="lg">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link href={`/shop/${slug}/shop`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View All
          </Link>
        </div>
        {featuredProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            {featuredProducts.map((product: Product) => (
              <StorefrontProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            No featured products yet.
          </div>
        )}
      </section>
    </div>
  );
}
