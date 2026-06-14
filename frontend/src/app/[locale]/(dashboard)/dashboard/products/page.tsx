"use client";

import { ProductList } from "@/features/products/product-list";
import { CategoryTree } from "@/features/products/category-tree";
import { CollectionList } from "@/features/products/collection-list";
import { useState } from "react";
import { Package, FolderTree, Layers } from "lucide-react";
import { useTranslations } from "next-intl";

type Tab = "products" | "categories" | "collections";

export default function ProductsPage() {
  const t = useTranslations("dashboard.products");
  const [tab, setTab] = useState<Tab>("products");

  const tabs = [
    { key: "products" as Tab, label: t("tabProducts"), icon: Package },
    { key: "categories" as Tab, label: t("tabCategories"), icon: FolderTree },
    { key: "collections" as Tab, label: t("tabCollections"), icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("description")}</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "products" && <ProductList />}
      {tab === "categories" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryTree />
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">{t("categoryHelp")}</p>
          </div>
        </div>
      )}
      {tab === "collections" && <CollectionList />}
    </div>
  );
}
