"use client";

import { DiscountsDashboard } from "@/features/commerce/discounts-dashboard";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/ui";

export default function DiscountsPage() {
  const t = useTranslations("dashboard.discounts");
  return (
    <div className="space-y-6">
              <PageHeader title={t("title")} />
      <DiscountsDashboard />
    </div>
  );
}
