"use client";

import { DiscountsDashboard } from "@/features/commerce/discounts-dashboard";
import { useTranslations } from "next-intl";

export default function DiscountsPage() {
  const t = useTranslations("dashboard.discounts");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>
      <DiscountsDashboard />
    </div>
  );
}
