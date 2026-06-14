"use client";

import { AnalyticsDashboard } from "@/features/analytics/analytics-dashboard";
import { useTranslations } from "next-intl";

export default function AnalyticsPage() {
  const t = useTranslations("dashboard.analytics");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500">{t("description")}</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
