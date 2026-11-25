"use client";

import { InventoryManager } from "@/features/products/inventory-manager";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/ui";

export default function InventoryPage() {
  const t = useTranslations("dashboard.inventory");
  return (
    <div className="space-y-6">
              <PageHeader title={t("title")} description={t("description")} />
      <InventoryManager />
    </div>
  );
}
