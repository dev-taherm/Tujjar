"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Badge } from "@/shared/ui";
import { ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { useState } from "react";

export default function StorefrontProductDetailPage({ params }: { params: { slug: string } }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["storefront", "product", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/store/default/products/${params.slug}/`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-gray-200" />
          <div className="space-y-4">
            <div className="h-8 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
            <div className="h-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="py-16 text-center text-gray-500">Product not found</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
          {product.primary_image ? (
            <img src={product.primary_image.url} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">No Image</div>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">${product.price}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-lg text-gray-400 line-through">${product.compare_at_price}</span>
              )}
            </div>
          </div>
          <p className="text-gray-600">{product.description}</p>
          {product.variants?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700">Options</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button key={v.id} onClick={() => setSelectedVariant(v.id)} className={`rounded-lg border px-3 py-1.5 text-sm ${selectedVariant === v.id ? "border-primary-500 bg-primary-50" : "border-gray-200"}`}>
                    {v.name} {v.price && <span className="text-gray-500">${v.price}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-200">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2"><Minus className="h-4 w-4" /></button>
              <span className="px-4 text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2"><Plus className="h-4 w-4" /></button>
            </div>
            <Button className="flex-1" size="lg"><ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart</Button>
            <Button variant="outline" size="lg"><Heart className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
