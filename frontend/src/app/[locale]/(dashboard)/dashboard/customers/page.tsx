"use client";

import { CustomerList } from "@/features/customers/customer-list";
import { PageHeader } from "@/shared/ui";
import { useTranslations } from "next-intl";

export default function CustomersPage() {
  const t = useTranslations("dashboard.customer");
  return (
    <div className="space-y-6 animate-rise">
      <PageHeader title={t("title")} description={t("description")} />
      <CustomerList />
    </div>
  );
}
