"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui";
import { useTranslations } from "next-intl";
import { useAnalyticsSummary } from "@/api/analytics";

export default function DashboardPage() {
  const t = useTranslations("dashboard.page");
  const { data: stats, isLoading } = useAnalyticsSummary();

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8 text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{t("title")}</h1>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-32 animate-pulse rounded bg-gray-200 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{t("title")}</h1>
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{t("totalRevenue")}</CardDescription>
            <CardTitle className="text-lg sm:text-xl md:text-2xl">
              ${(stats?.total_revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("totalOrders")}</CardDescription>
            <CardTitle className="text-lg sm:text-xl md:text-2xl">
              {(stats?.total_orders ?? 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("customers")}</CardDescription>
            <CardTitle className="text-lg sm:text-xl md:text-2xl">
              {(stats?.total_customers ?? 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("products")}</CardDescription>
            <CardTitle className="text-lg sm:text-xl md:text-2xl">
              {(stats?.total_products_sold ?? 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
