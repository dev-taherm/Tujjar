"use client";

import { useTranslations } from "next-intl";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("dashboard.error");
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {error.message || t("defaultMessage")}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t("tryAgain")}
        </button>
      </div>
    </div>
  );
}
