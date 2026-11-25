"use client";

import { ShippingDashboard } from "@/features/commerce/shipping-dashboard";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/ui";

export default function ShippingPage() {
  const t = useTranslations("dashboard.shipping");
  return (
    <div className="space-y-6">
              <PageHeader title={t("title")} />
      <ShippingDashboard />
    </div>
  );
}
