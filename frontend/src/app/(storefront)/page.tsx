import { Metadata } from "next";
import { StorefrontProductCard } from "@/features/storefront/product-card";
import { Button } from "@/shared/ui";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Home",
};

// This would be populated from the API in production
const featuredProducts: any[] = [];

export default function StorefrontHomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Welcome to our store
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Discover our curated collection of products. Quality, style, and innovation.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/products">
                <Button size="lg">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/collections">
                <Button variant="outline" size="lg">Browse Collections</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link href="/products" className="text-sm font-medium text-primary-600 hover:text-primary-700">View All</Link>
        </div>
        {featuredProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <StorefrontProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            No featured products yet. Add products to your store to see them here.
          </div>
        )}
      </section>
    </div>
  );
}
