"use client";

import { InventoryManager } from "@/features/products/inventory-manager";
import { useTranslations } from "next-intl";

export default function InventoryPage() {
  const t = useTranslations("dashboard.inventory");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("description")}</p>
      </div>
      <InventoryManager />
    </div>
  );
}
