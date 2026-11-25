"use client";

import { TaxesDashboard } from "@/features/commerce/taxes-dashboard";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/ui";

export default function TaxesPage() {
  const t = useTranslations("dashboard.taxes");
  return (
    <div className="space-y-6">
              <PageHeader title={t("title")} />
      <TaxesDashboard />
    </div>
  );
}
