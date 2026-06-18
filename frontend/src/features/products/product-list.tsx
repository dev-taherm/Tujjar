"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, SearchInput, EmptyState } from "@/shared/ui";
import { ProductCard } from "./product-card";
import { useProducts, useDeleteProduct, useDuplicateProduct } from "@/api/queries";
import { Plus, Package, MoreHorizontal, Copy, Trash2, Eye } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";

export function ProductList() {
  const t = useTranslations("dashboard.products");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteProduct = useDeleteProduct();
  const duplicateProduct = useDuplicateProduct();

  const { data: allProducts, isLoading } = useProducts({
    search: search || undefined,
  });

  const products = allProducts?.filter((p) => !statusFilter || p.status === statusFilter);

  const counts = {
    all: allProducts?.length ?? 0,
    active: allProducts?.filter((p) => p.status === "active").length ?? 0,
    draft: allProducts?.filter((p) => p.status === "draft").length ?? 0,
    archived: allProducts?.filter((p) => p.status === "archived").length ?? 0,
  };

  useEffect(() => {
    if (!openMenuId) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenuId]);

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProduct.mutateAsync(id);
      toast.success("Product duplicated");
      setOpenMenuId(null);
    } catch {
      toast.error("Failed to duplicate product");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
      setOpenMenuId(null);
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

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
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            {(["all", "active", "draft", "archived"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab === "all" ? "" : tab)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  (tab === "all" && statusFilter === "") || statusFilter === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "all" ? t("allStatuses") : tab === "archived" ? t("archived") : tc(tab)}
                <span className="ml-1.5 text-xs text-gray-400">{counts[tab]}</span>
              </button>
            ))}
          </div>
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
            <div key={product.id} className="relative">
              <ProductCard
                product={product}
                onClick={() => router.push(`/${locale}/dashboard/products/${product.id}`)}
              />
              <div ref={openMenuId === product.id ? menuRef : undefined} className="absolute right-2 top-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === product.id ? null : product.id);
                  }}
                  className="rounded-full bg-white/90 p-1.5 text-gray-600 shadow-sm backdrop-blur hover:bg-white hover:text-gray-900"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenuId === product.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${locale}/dashboard/products/${product.id}`);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(product.id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4" /> Duplicate
                    </button>
                    {product.status === "archived" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
                        disabled={deletingId === product.id}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
