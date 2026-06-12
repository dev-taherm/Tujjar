import Link from "next/link";
import type { Product } from "@/shared/types";

export function StorefrontProductCard({ product, slug }: { product: Product; slug?: string }) {
  const href = slug ? `/shop/${slug}/shop/${product.slug}` : `/products/${product.slug}`;
  return (
    <Link href={href} className="group block">
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
        {product.primary_image ? (
          <img src={product.primary_image.url} alt={product.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600">{product.title}</h3>
        <div className="mt-1 flex items-center gap-2">
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-gray-400 line-through">${product.compare_at_price}</span>
          )}
          <span className="text-sm font-semibold text-gray-900">${product.price}</span>
        </div>
      </div>
    </Link>
  );
}
