"use client";

import { Badge } from "@/shared/ui";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/shared/types";
import { Package, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const t = useTranslations("dashboard.products");
  const statusColors: Record<string, string> = {
    draft: "bg-rail text-ink",
    active: "bg-success-soft text-success",
    archived: "bg-error-soft text-error",
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-xl border border-line bg-panel transition-all hover:shadow-md hover:border-primary-300 active:scale-[0.98] active:shadow-sm"
    >
      {/* Image */}
      <div className="relative aspect-square bg-rail">
        {product.primary_image ? (
          <img
            src={product.primary_image.url}
            alt={product.primary_image.alt_text || product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-ink-soft" />
          </div>
        )}
        {product.is_on_sale && (
          <div className="absolute start-2 top-2">
            <Badge variant="danger">{t("sale")}</Badge>
          </div>
        )}
        {!product.is_in_stock && (
          <div className="absolute end-2 top-2">
            <Badge variant="secondary">{t("outOfStockBadge")}</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink line-clamp-1">{product.title}</h3>
          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[product.status] || ""}`}>
            {product.status}
          </span>
        </div>

        {product.sku && (
          <p className="mb-2 text-xs text-ink-soft">SKU: {product.sku}</p>
        )}

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">{formatCurrency(Number(product.price))}</span>
          {product.is_on_sale && product.compare_at_price && (
            <span className="text-sm text-ink-soft line-through">{formatCurrency(Number(product.compare_at_price))}</span>
          )}
        </div>

        {product.category_names && product.category_names.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.category_names.slice(0, 2).map((name) => (
              <span key={name} className="inline-flex items-center gap-1 rounded-full bg-rail px-2 py-0.5 text-xs text-ink-soft">
                <Tag className="h-3 w-3" />
                {name}
              </span>
            ))}
            {product.category_names.length > 2 && (
              <span className="text-xs text-ink-soft">+{product.category_names.length - 2}</span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
          <span>Stock: {product.track_inventory ? product.inventory_quantity : t("unlimited")}</span>
          <span>{product.total_sold} {t("sold")}</span>
        </div>
      </div>
    </div>
  );
}
