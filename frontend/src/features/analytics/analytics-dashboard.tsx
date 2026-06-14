"use client";

import { useAnalyticsSummary, useRealtimeStats } from "@/api/queries";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Eye, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

function StatCard({ label, value, change, icon: Icon, color, changeLabel }: { label: string; value: string | number; change?: number; icon: React.ElementType; color: string; changeLabel?: string }) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", isPositive ? "text-green-600" : "text-red-600")}>
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

function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const t = useTranslations("dashboard.analytics");
  if (!data?.length) return null;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{t("revenueLast30Days")}</h3>
      <div className="flex items-end gap-1 h-48">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-primary-500 rounded-t" style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? 4 : 0 }} />
            <span className="text-[10px] text-gray-400">{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RealtimeCard() {
  const t = useTranslations("dashboard.analytics");
  const { data: stats } = useRealtimeStats();
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-green-600" />
        <h3 className="text-sm font-semibold text-green-900">{t("realtime24h")}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-green-700">{t("visitors")}</span><p className="font-bold">{stats?.visitors || 0}</p></div>
        <div><span className="text-green-700">{t("pageViews")}</span><p className="font-bold">{stats?.page_views || 0}</p></div>
        <div><span className="text-green-700">{t("productViews")}</span><p className="font-bold">{stats?.product_views || 0}</p></div>
        <div><span className="text-green-700">{t("purchases")}</span><p className="font-bold">{stats?.purchases || 0}</p></div>
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
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("totalRevenue")} value={`$${(summary?.total_revenue || 0).toLocaleString()}`} change={summary?.revenue_change_pct} changeLabel={t("vsLastPeriod")} icon={DollarSign} color="bg-green-50 text-green-600" />
        <StatCard label={t("totalOrders")} value={summary?.total_orders || 0} change={summary?.orders_change_pct} changeLabel={t("vsLastPeriod")} icon={ShoppingCart} color="bg-blue-50 text-blue-600" />
        <StatCard label={t("totalCustomers")} value={summary?.total_customers || 0} change={summary?.customers_change_pct} changeLabel={t("vsLastPeriod")} icon={Users} color="bg-purple-50 text-purple-600" />
        <StatCard label={t("productsSold")} value={summary?.total_products_sold || 0} icon={Eye} color="bg-orange-50 text-orange-600" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={summary?.revenue_chart || []} />
        </div>
        <RealtimeCard />
      </div>
    </div>
  );
}
