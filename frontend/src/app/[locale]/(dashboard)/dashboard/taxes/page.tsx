"use client";

import { TaxesDashboard } from "@/features/commerce/taxes-dashboard";
import { useTranslations } from "next-intl";

export default function TaxesPage() {
  const t = useTranslations("dashboard.taxes");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>
      <TaxesDashboard />
    </div>
  );
}
