"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Badge } from "@/shared/ui";
import { ProductCard } from "./product-card";
import { useProducts, useDeleteProduct } from "@/api/queries";
import { Plus, Search, Filter, Package } from "lucide-react";
import { useTranslations } from "next-intl";

export function ProductList() {
  const t = useTranslations("dashboard.products");
  const tc = useTranslations("common");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const deleteProduct = useDeleteProduct();

  const statusOptions = [
    { value: "", label: t("allStatuses") },
    { value: "draft", label: tc("draft") },
    { value: "active", label: tc("active") },
    { value: "archived", label: t("archived") },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 ps-10 pe-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push("/dashboard/products/new")}>
          <Plus className="me-2 h-4 w-4" /> {t("addProduct")}
        </Button>
      </div>

      {/* Products Grid */}
      {!products?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16">
          <Package className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">{t("noProducts")}</h3>
          <p className="mb-6 text-sm text-gray-500">{t("createFirstProduct")}</p>
          <Button onClick={() => router.push("/dashboard/products/new")}>
            <Plus className="me-2 h-4 w-4" /> {t("addProduct")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => router.push(`/dashboard/products/${product.id}`)}
            />
          ))}
        </div>
      )}
    </>
  );
}
