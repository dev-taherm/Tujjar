"use client";

import { useState, Fragment } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { useProducts, useUpdateInventory } from "@/api/queries";
import { AlertTriangle, ChevronDown, ChevronRight, Package, TrendingDown, TrendingUp } from "lucide-react";
import { useInventoryMovements } from "@/api/products";
import { useTranslations } from "next-intl";

export function InventoryManager() {
  const t = useTranslations("dashboard.products");
  const { data: products, isLoading } = useProducts({ status: "active" });
  const updateInventory = useUpdateInventory();
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [showLowStock, setShowLowStock] = useState(true);
  const [showMovements, setShowMovements] = useState(true);
  const { data: movements = [] } = useInventoryMovements();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkAdjustment, setBulkAdjustment] = useState(0);
  const [movementLimit, setMovementLimit] = useState(20);

  const filteredMovements = movements.filter(m => {
    if (reasonFilter && m.reason !== reasonFilter) return false;
    if (dateFrom && new Date(m.created_at) < new Date(dateFrom)) return false;
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(m.created_at) > to) return false;
    }
    return true;
  });
  const displayedMovements = filteredMovements.slice(0, movementLimit);

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

  const handleBulkAdjust = async () => {
    if (!bulkAdjustment || selectedProducts.length === 0) return;
    for (const productId of selectedProducts) {
      await updateInventory.mutateAsync({ id: productId, adjustment: bulkAdjustment });
    }
    setSelectedProducts([]);
    setBulkAdjustment(0);
    setBulkMode(false);
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

      {/* Bulk Adjust */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => { setBulkMode(!bulkMode); setSelectedProducts([]); setBulkAdjustment(0); }}
          className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 text-left hover:bg-blue-100"
        >
          {bulkMode ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <h3 className="font-semibold text-blue-700">Bulk Adjust Inventory</h3>
        </button>
        {bulkMode && (
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <input
                type="number"
                value={bulkAdjustment || ""}
                onChange={e => setBulkAdjustment(parseInt(e.target.value) || 0)}
                placeholder="+/- Adjustment"
                className="w-32 px-3 py-2 border rounded-lg text-sm"
              />
              <Button
                onClick={handleBulkAdjust}
                disabled={!bulkAdjustment || selectedProducts.length === 0}
                size="sm"
              >
                Apply to {selectedProducts.length} products
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {products?.map((product) => (
                <label key={product.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedProducts(prev => [...prev, product.id]);
                      else setSelectedProducts(prev => prev.filter(id => id !== product.id));
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{product.title}</span>
                  <span className="ml-auto text-xs text-gray-400">Stock: {product.inventory_quantity}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Critical Low Stock (quantity < 5) */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 text-left hover:bg-red-100"
        >
          {showLowStock ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <h3 className="font-semibold text-red-700">
            Low Stock (under 5 units) — {products?.filter((p) => p.track_inventory && p.inventory_quantity < 5).length || 0}
          </h3>
        </button>
        {showLowStock && (
          <div className="p-4">
            {products?.filter((p) => p.track_inventory && p.inventory_quantity < 5).length === 0 ? (
              <p className="text-gray-500">No products with critically low stock.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Quantity</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      ?.filter((p) => p.track_inventory && p.inventory_quantity < 5)
                      .map((product) => (
                        <Fragment key={product.id}>
                          <tr className="border-b bg-red-50 hover:bg-red-100">
                            <td className="py-2 font-medium">{product.title}</td>
                            <td className="py-2">{product.inventory_quantity}</td>
                            <td className="py-2">
                              {product.inventory_quantity === 0 ? (
                                <span className="text-red-600 font-semibold">Out of Stock</span>
                              ) : (
                                <span className="text-red-600">Low Stock</span>
                              )}
                            </td>
                          </tr>
                          {product.variants?.map((variant) => (
                            <tr key={variant.id} className="border-b bg-red-25">
                              <td className="py-1.5 pl-6 text-sm text-gray-600">↳ {variant.title}</td>
                              <td className="py-1.5 text-sm">{variant.inventory_quantity}</td>
                              <td className="py-1.5 text-sm">
                                {variant.inventory_quantity === 0 ? (
                                  <span className="text-red-600">Out of Stock</span>
                                ) : variant.inventory_quantity < 5 ? (
                                  <span className="text-red-600">Low</span>
                                ) : (
                                  <span className="text-green-600">OK</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Movements */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowMovements(!showMovements)}
          className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 text-left hover:bg-gray-100"
        >
          {showMovements ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <h3 className="font-semibold">Recent Movements</h3>
        </button>
        {showMovements && (
          <div className="p-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                <select
                  value={reasonFilter}
                  onChange={e => setReasonFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All</option>
                  <option value="sale">Sale</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="restock">Restock</option>
                  <option value="correction">Correction</option>
                  <option value="return">Return</option>
                </select>
              </div>
              {(dateFrom || dateTo || reasonFilter) && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); setReasonFilter(""); }}
                  className="self-end px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear filters
                </button>
              )}
            </div>
            {filteredMovements.length === 0 ? (
              <p className="text-gray-500">No inventory movements recorded yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Product</th>
                        <th className="text-left py-2">Adjustment</th>
                        <th className="text-left py-2">Reason</th>
                        <th className="text-left py-2">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedMovements.map((m) => {
                        const product = products?.find(p => p.id === m.product);
                        const variant = product?.variants?.find(v => v.id === m.variant);
                        return (
                          <tr key={m.id} className="border-b hover:bg-gray-50">
                            <td className="py-2">{new Date(m.created_at).toLocaleDateString()}</td>
                            <td className="py-2">
                              {product?.title || "—"}
                              {variant && <span className="text-gray-400 ml-1">/ {variant.title}</span>}
                            </td>
                            <td className="py-2">
                              <span className={m.adjustment > 0 ? "text-green-600" : "text-red-600"}>
                                {m.adjustment > 0 ? "+" : ""}{m.adjustment}
                              </span>
                            </td>
                            <td className="py-2 capitalize">{m.reason}</td>
                            <td className="py-2">{m.created_by_email || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredMovements.length > movementLimit && (
                  <button
                    onClick={() => setMovementLimit(prev => prev + 20)}
                    className="mt-3 w-full py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                  >
                    Load more ({filteredMovements.length - movementLimit} remaining)
                  </button>
                )}
              </>
            )}
          </div>
        )}
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
                <div key={product.id} className="flex flex-wrap items-center gap-3 md:gap-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
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
