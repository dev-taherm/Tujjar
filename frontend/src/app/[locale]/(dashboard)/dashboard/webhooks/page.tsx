"use client";

import { WebhooksDashboard } from "@/features/commerce/webhooks-dashboard";
import { useTranslations } from "next-intl";

export default function WebhooksPage() {
  const t = useTranslations("dashboard.webhooks");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>
      <WebhooksDashboard />
    </div>
  );
}
