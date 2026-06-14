"use client";

import { Badge } from "@/shared/ui";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/shared/types";
import { Package, Tag, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const t = useTranslations("dashboard.products");
  const tc = useTranslations("common");
  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    archived: "bg-red-100 text-red-700",
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md hover:border-primary-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.primary_image ? (
          <img
            src={product.primary_image.url}
            alt={product.primary_image.alt_text || product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {product.is_on_sale && (
          <div className="absolute left-2 top-2">
            <Badge variant="danger">{t("sale")}</Badge>
          </div>
        )}
        {!product.is_in_stock && (
          <div className="absolute right-2 top-2">
            <Badge variant="secondary">{t("outOfStockBadge")}</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[product.status] || ""}`}>
            {product.status}
          </span>
        </div>

        {product.sku && (
          <p className="mb-2 text-xs text-gray-500">SKU: {product.sku}</p>
        )}

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">{formatCurrency(Number(product.price))}</span>
          {product.is_on_sale && product.compare_at_price && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(Number(product.compare_at_price))}</span>
          )}
        </div>

        {product.category_names && product.category_names.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.category_names.slice(0, 2).map((name) => (
              <span key={name} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                <Tag className="h-3 w-3" />
                {name}
              </span>
            ))}
            {product.category_names.length > 2 && (
              <span className="text-xs text-gray-400">+{product.category_names.length - 2}</span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>Stock: {product.track_inventory ? product.inventory_quantity : t("unlimited")}</span>
          <span>{product.total_sold} {t("sold")}</span>
        </div>
      </div>
    </div>
  );
}
