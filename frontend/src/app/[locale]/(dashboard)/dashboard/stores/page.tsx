"use client";

import { StoreList } from "@/features/store/store-list";
import { useTranslations } from "next-intl";

export default function StoresPage() {
  const t = useTranslations("dashboard.page");
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("stores")}</h1>
      <StoreList />
    </div>
  );
}
