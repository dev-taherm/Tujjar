"use client";

import { NotificationPanel } from "@/features/notifications/notification-panel";
import { useTranslations } from "next-intl";

export default function NotificationsPage() {
  const t = useTranslations("dashboard.notifications");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500">{t("description")}</p>
      </div>
      <div className="flex justify-center">
        <NotificationPanel />
      </div>
    </div>
  );
}
