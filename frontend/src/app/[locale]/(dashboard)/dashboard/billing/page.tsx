"use client";

import { BillingDashboard } from "@/features/billing/billing-dashboard";
import { useTranslations } from "next-intl";

export default function BillingPage() {
  const t = useTranslations("dashboard.billing");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500">{t("description")}</p>
      </div>
      <BillingDashboard />
    </div>
  );
}
