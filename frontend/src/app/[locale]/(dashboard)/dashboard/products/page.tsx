"use client";

import { ProductList } from "@/features/products/product-list";
import { CategoryTree } from "@/features/products/category-tree";
import { CollectionList } from "@/features/products/collection-list";
import { useState } from "react";
import { Package, FolderTree, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader, Tabs, type TabItem } from "@/shared/ui";

type Tab = "products" | "categories" | "collections";

export default function ProductsPage() {
  const t = useTranslations("dashboard.products");
  const [tab, setTab] = useState<Tab>("products");

  const tabs: TabItem[] = [
    { id: "products", label: t("tabs.products"), icon: Package },
    { id: "categories", label: t("tabs.categories"), icon: FolderTree },
    { id: "collections", label: t("tabs.collections"), icon: Layers },
  ];

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader title={t("title")} description={t("description")} />

      <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as Tab)} variant="segmented" className="w-fit" />

      {tab === "products" && <ProductList />}
      {tab === "categories" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryTree />
          <div className="rounded-xl border border-line bg-panel p-6">
            <p className="text-sm text-ink-soft">{t("categoryHelp")}</p>
          </div>
        </div>
      )}
      {tab === "collections" && <CollectionList />}
    </div>
  );
}
