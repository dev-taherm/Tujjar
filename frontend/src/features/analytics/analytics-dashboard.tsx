"use client";

import { useAnalyticsSummary } from "@/api/queries";
import { Card } from "@/shared/ui";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

function StatCard({ label, value, change, icon: Icon, color, changeLabel }: { label: string; value: string | number; change?: number; icon: React.ElementType; color: string; changeLabel?: string }) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-soft">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", isPositive ? "text-success" : "text-error")}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change)}% {changeLabel}
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", color)}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const t = useTranslations("dashboard.analytics");
  const { data: summary, isLoading } = useAnalyticsSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 shimmer rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("totalRevenue")} value={`$${(summary?.total_revenue || 0).toLocaleString()}`} change={summary?.revenue_change_pct} changeLabel={t("vsLastPeriod")} icon={DollarSign} color="bg-success-soft text-success" />
        <StatCard label={t("totalOrders")} value={summary?.total_orders || 0} change={summary?.orders_change_pct} changeLabel={t("vsLastPeriod")} icon={ShoppingCart} color="bg-primary-50 text-primary-600" />
        <StatCard label={t("totalCustomers")} value={summary?.total_customers || 0} change={summary?.customers_change_pct} changeLabel={t("vsLastPeriod")} icon={Users} color="bg-purple-50 text-purple-600" />
        <StatCard label={t("productsSold")} value={summary?.total_products_sold || 0} icon={Eye} color="bg-orange-50 text-orange-600" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {!!summary?.top_products?.length && (
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("topProducts")}</h3>
            <div className="space-y-2">
              {summary.top_products.map((p, i) => (
                <div key={`${p.title}-${i}`} className="flex items-center justify-between text-sm">
                  <span className="truncate" style={{ maxWidth: "55%" }}>{p.title}</span>
                  <span className="text-ink-soft">
                    {p.units_sold} sold · ${Number(p.revenue).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
        {!!Object.keys(summary?.traffic_sources ?? {}).length && (
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("trafficSources")}</h3>
            <div className="space-y-2">
              {Object.entries(summary!.traffic_sources).map(([host, count]) => (
                <div key={host} className="flex items-center justify-between text-sm">
                  <span className="truncate" style={{ maxWidth: "60%" }}>{host}</span>
                  <span className="text-ink-soft">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
