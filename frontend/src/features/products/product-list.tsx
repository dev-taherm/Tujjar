"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, SearchInput, EmptyState, Dialog, Dropdown, DropdownItem } from "@/shared/ui";
import { ProductCard } from "./product-card";
import { useProducts, useDeleteProduct, useDuplicateProduct } from "@/api/queries";
import { Plus, Package, MoreHorizontal, Copy, Trash2, Eye, Download, Upload } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deleteProduct = useDeleteProduct();
  const duplicateProduct = useDuplicateProduct();
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/products/import-export/export/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(tc("error"));
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch("/api/v1/products/import-export/import/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "import failed");
      toast.success(
        t("importDone", { created: data.created, updated: data.updated, failed: data.failed })
      );
      if (data.errors?.length) {
        toast.error(data.errors[0].error);
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.refresh();
    } catch {
      toast.error(tc("error"));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProduct.mutateAsync(id);
      toast.success("Product duplicated");
    } catch {
      toast.error("Failed to duplicate product");
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
      setConfirmDelete(null);
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
          <div key={i} className="h-80 shimmer rounded-xl" />
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
          <div className="flex items-center gap-1 rounded-lg bg-rail p-1">
            {(["all", "active", "draft", "archived"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab === "all" ? "" : tab)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  (tab === "all" && statusFilter === "") || statusFilter === tab
                    ? "bg-panel text-ink shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab === "all" ? t("allStatuses") : tab === "archived" ? t("archived") : tc(tab)}
                <span className="ms-1.5 text-xs text-ink-soft">{counts[tab]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} isLoading={exporting}>
            <Download className="me-2 h-4 w-4" /> {t("exportCsv")}
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} isLoading={importing}>
            <Upload className="me-2 h-4 w-4" /> {t("importCsv")}
          </Button>
          <Button onClick={() => router.push(`/${locale}/dashboard/products/new`)}>
            <Plus className="me-2 h-4 w-4" /> {t("addProduct")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
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
              <div className="absolute end-2 top-2 z-10">
                <Dropdown
                  align="end"
                  minWidth="min-w-40"
                  trigger={
                    <span className="flex cursor-pointer rounded-full bg-panel/90 p-1.5 text-ink-soft shadow-sm backdrop-blur transition-colors hover:bg-panel hover:text-ink">
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  }
                >
                  <DropdownItem
                    onClick={() => router.push(`/${locale}/dashboard/products/${product.id}`)}
                  >
                    <Eye className="h-4 w-4" /> View
                  </DropdownItem>
                  <DropdownItem onClick={() => handleDuplicate(product.id)}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </DropdownItem>
                  {product.status === "archived" && (
                    <DropdownItem
                      destructive
                      onClick={() => setConfirmDelete({ id: product.id, title: product.title })}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownItem>
                  )}
                </Dropdown>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t("deleteTitle")}>
        <p className="text-sm text-ink-soft">
          {t("deleteConfirm", { title: confirmDelete?.title || "" })}
        </p>
        <p className="mt-2 text-xs text-error">{t("deleteIrreversible")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
            {tc("cancel")}
          </Button>
          <Button
            variant="outline"
            className="border-error text-error hover:bg-error-soft"
            onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
            isLoading={!!deletingId}
          >
            {tc("delete")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
