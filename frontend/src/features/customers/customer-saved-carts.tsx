"use client";

import { Card, CardContent, EmptyState } from "@/shared/ui";
import { useSavedCarts, useDeleteSavedCart } from "@/api/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SavedCart } from "@/shared/types";

interface CustomerSavedCartsProps {
  customerId: string;
}

export function CustomerSavedCarts({ customerId }: CustomerSavedCartsProps) {
  const t = useTranslations("dashboard.customer");
  const { data: carts = [], isLoading } = useSavedCarts(customerId);
  const deleteSavedCart = useDeleteSavedCart();

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("savedCarts")}</h2>
      {carts.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={t("noSavedCarts")} description={t("noSavedCartsDesc")} />
      ) : (
        <div className="space-y-4">
          {carts.map((cart: SavedCart) => (
            <Card key={cart.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{cart.name}</h3>
                    <p className="text-sm text-gray-500">
                      {cart.item_count} {cart.item_count === 1 ? "item" : "items"}
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(cart.created_at)}</p>
                  </div>
                  <button
                    onClick={() => deleteSavedCart.mutate(cart.id)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {cart.items.length > 0 && (
                  <div className="mt-3 space-y-1 border-t pt-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product_title} × {item.quantity}
                        </span>
                        <span>{formatCurrency(Number(item.unit_price))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
