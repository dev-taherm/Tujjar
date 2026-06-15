"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Badge, SearchInput, EmptyState } from "@/shared/ui";
import { ProductCard } from "./product-card";
import { useProducts, useDeleteProduct } from "@/api/queries";
import { Plus, Filter, Package } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export function ProductList() {
  const t = useTranslations("dashboard.products");
  const tc = useTranslations("common");
  const locale = useLocale();
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
          <SearchInput value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push(`/${locale}/dashboard/products/new`)}>
          <Plus className="me-2 h-4 w-4" /> {t("addProduct")}
        </Button>
      </div>

      {/* Products Grid */}
      {!products?.length ? (
        <EmptyState
          icon={Package}
          title={t("noProducts")}
          description={t("createFirstProduct")}
          action={<Button onClick={() => router.push(`/${locale}/dashboard/products/new`)}><Plus className="me-2 h-4 w-4" /> {t("addProduct")}</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => router.push(`/${locale}/dashboard/products/${product.id}`)}
            />
          ))}
        </div>
      )}
    </>
  );
}
