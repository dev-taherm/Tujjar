"use client";

import { PageList } from "@/features/pages/page-list";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/ui";

export default function PagesPage() {
  const t = useTranslations("dashboard.pages");
  return (
    <div className="space-y-6">
              <PageHeader title={t("title")} description={t("description")} />
      <PageList />
    </div>
  );
}
