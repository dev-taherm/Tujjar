"use client";

import { OrderList } from "@/features/orders/order-list";
import { PageHeader } from "@/shared/ui";
import { useTranslations } from "next-intl";

export default function OrdersPage() {
  const t = useTranslations("dashboard.orders");
  return (
    <div className="space-y-6 animate-rise">
      <PageHeader title={t("title")} description={t("description")} />
      <OrderList />
    </div>
  );
}
