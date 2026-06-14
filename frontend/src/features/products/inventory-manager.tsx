"use client";

import { useState } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from "@/shared/ui";
import { useProducts, useUpdateInventory } from "@/api/queries";
import { AlertTriangle, Package, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function InventoryManager() {
  const t = useTranslations("dashboard.products");
  const tc = useTranslations("common");
  const { data: products, isLoading } = useProducts({ status: "active" });
  const updateInventory = useUpdateInventory();
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const lowStockProducts = products?.filter(
    (p) => p.track_inventory && p.inventory_quantity <= p.low_stock_threshold
  ) || [];

  const outOfStockProducts = products?.filter(
    (p) => p.track_inventory && p.inventory_quantity === 0
  ) || [];

  const handleAdjust = async (productId: string) => {
    const adjustment = adjustments[productId];
    if (!adjustment) return;
    await updateInventory.mutateAsync({ id: productId, adjustment });
    setAdjustments((prev) => ({ ...prev, [productId]: 0 }));
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-200" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><Package className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">{t("totalProducts")}</p>
                <p className="text-2xl font-bold">{products?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-gray-500">{t("lowStock")}</p>
                <p className="text-2xl font-bold">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2"><TrendingDown className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-gray-500">{t("outOfStock")}</p>
                <p className="text-2xl font-bold">{outOfStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              {t("lowStockAlert")} ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.title}</p>
                    <p className="text-sm text-gray-500">
                      Stock: {product.inventory_quantity} / Threshold: {product.low_stock_threshold}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={adjustments[product.id] || ""}
                      onChange={(e) => setAdjustments((prev) => ({ ...prev, [product.id]: parseInt(e.target.value) || 0 }))}
                      placeholder="+/-"
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    />
                    <Button size="sm" onClick={() => handleAdjust(product.id)} disabled={!adjustments[product.id]}>
                      <TrendingUp className="me-1 h-3 w-3" /> {t("adjust")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
