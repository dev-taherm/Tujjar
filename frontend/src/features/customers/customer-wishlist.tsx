"use client";

import { Card, CardContent, EmptyState } from "@/shared/ui";
import { useWishlist, useRemoveFromWishlist } from "@/api/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Heart, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface CustomerWishlistProps {
  customerId: string;
}

export function CustomerWishlist({ customerId }: CustomerWishlistProps) {
  const t = useTranslations("dashboard.customer");
  const { data: items = [], isLoading } = useWishlist(customerId);
  const removeFromWishlist = useRemoveFromWishlist();

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("wishlist")}</h2>
      {items.length === 0 ? (
        <EmptyState icon={Heart} title={t("noWishlistItems")} description={t("noWishlistItemsDesc")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.product_title}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(Number(item.product_price))}</p>
                  </div>
                  <button
                    onClick={() => removeFromWishlist.mutate(item.id)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {item.note && <p className="mt-2 text-sm text-gray-500">{item.note}</p>}
                <p className="mt-2 text-xs text-gray-400">{formatDateTime(item.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
