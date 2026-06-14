"use client";

import { ThemeList } from "@/features/themes/theme-list";
import { useTranslations } from "next-intl";

export default function ThemesPage() {
  const t = useTranslations("dashboard.themes");
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("title")}</h1>
      <ThemeList />
    </div>
  );
}
