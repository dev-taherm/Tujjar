import { Link } from "@/i18n";
import type { Product } from "@/shared/types";

export function StorefrontProductCard({ product, slug }: { product: Product; slug?: string }) {
  const href = slug ? `/shop/${slug}/shop/${product.slug}` : `/products/${product.slug}`;
  const compare = Number(product.compare_at_price) || 0;
  const price = Number(product.price) || 0;
  const discountPct = compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
  return (
    <Link href={href} className="group relative block">
      {discountPct > 0 && (
        <span
          className="absolute end-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          style={{ background: "var(--color-error, #ef4444)" }}
        >
          -{discountPct}%
        </span>
      )}
      <div className="aspect-square overflow-hidden rounded-xl" style={{ background: "var(--color-surface)" }}>
        {product.primary_image ? (
          <img src={product.primary_image.url} alt={product.title} width={400} height={400} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105 active:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>No Image</div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-medium transition-colors" style={{ color: "var(--color-text)" }}>
          <span className="group-hover:underline" style={{ color: "var(--color-primary)" }}>{product.title}</span>
        </h3>
        <div className="mt-1 flex items-center gap-2">
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm line-through" style={{ color: "var(--color-text-secondary)" }}>${product.compare_at_price}</span>
          )}
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>${product.price}</span>
        </div>
      </div>
    </Link>
  );
}
