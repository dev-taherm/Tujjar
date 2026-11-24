"use client";

import { ShippingDashboard } from "@/features/commerce/shipping-dashboard";
import { useTranslations } from "next-intl";

export default function ShippingPage() {
  const t = useTranslations("dashboard.shipping");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>
      <ShippingDashboard />
    </div>
  );
}
