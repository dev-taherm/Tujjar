"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("dashboard.page");
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("title")}</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{t("totalRevenue")}</CardDescription>
            <CardTitle className="text-2xl">$0.00</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("totalOrders")}</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("customers")}</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("products")}</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
