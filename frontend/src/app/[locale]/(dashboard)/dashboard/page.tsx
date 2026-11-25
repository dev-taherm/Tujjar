"use client";

import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, PageHeader, StatCard } from "@/shared/ui";
import { AIBriefCard } from "@/features/dashboard/ai-brief-card";
import { SetupChecklist } from "@/features/dashboard/setup-checklist";
import { useTranslations } from "next-intl";
import { useAnalyticsSummary } from "@/api/analytics";

export default function DashboardPage() {
  const t = useTranslations("dashboard.page");
  const { data: stats, isLoading } = useAnalyticsSummary();

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t("title")} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="shimmer h-4 w-24 rounded" />
              <div className="shimmer mt-3 h-8 w-32 rounded" />
              <div className="shimmer mt-3 h-5 w-16 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <PageHeader title={t("title")} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("totalRevenue")}
          value={`$${(stats?.total_revenue ?? 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          delta={stats?.revenue_change_pct ?? null}
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label={t("totalOrders")}
          value={(stats?.total_orders ?? 0).toLocaleString()}
          delta={stats?.orders_change_pct ?? null}
          icon={ShoppingCart}
          tone="primary"
        />
        <StatCard
          label={t("customers")}
          value={(stats?.total_customers ?? 0).toLocaleString()}
          icon={Users}
          tone="info"
        />
        <StatCard
          label={t("products")}
          value={(stats?.total_products_sold ?? 0).toLocaleString()}
          icon={Package}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AIBriefCard />
        <SetupChecklist />
      </div>

      {(!!stats?.top_products?.length || !!Object.keys(stats?.traffic_sources ?? {}).length) && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {!!stats?.top_products?.length && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("topProducts")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.top_products.map((p) => (
                  <div key={p.title} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{p.title}</span>
                    <span className="shrink-0 text-ink-soft tabular-nums">
                      {p.units_sold} sold · ${p.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {!!Object.keys(stats?.traffic_sources ?? {}).length && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("trafficSources")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(stats!.traffic_sources).map(([host, count]) => (
                  <div key={host} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{host}</span>
                    <span className="shrink-0 text-ink-soft tabular-nums">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
