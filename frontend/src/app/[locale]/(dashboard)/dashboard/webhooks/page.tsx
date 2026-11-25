"use client";

import { WebhooksDashboard } from "@/features/commerce/webhooks-dashboard";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/ui";

export default function WebhooksPage() {
  const t = useTranslations("dashboard.webhooks");
  return (
    <div className="space-y-6">
              <PageHeader title={t("title")} />
      <WebhooksDashboard />
    </div>
  );
}
