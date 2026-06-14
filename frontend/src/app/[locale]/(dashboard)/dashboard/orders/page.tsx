"use client";

import { OrderList } from "@/features/orders/order-list";
import { useTranslations } from "next-intl";

export default function OrdersPage() {
  const t = useTranslations("dashboard.orders");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("description")}</p>
      </div>
      <OrderList />
    </div>
  );
}
