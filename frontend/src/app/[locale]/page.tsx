"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function HomePage() {
  const t = useTranslations("landing");
  const locale = useLocale();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="mb-4 text-6xl font-bold tracking-tight text-gray-900">
          {t("title")}
        </h1>
        <p className="mb-2 text-xl text-gray-600">
          {t("subtitle")}
        </p>
        <p className="mb-8 text-gray-500">
          {t("description")}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href={`/${locale}/login`}
            className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700"
          >
            {t("signIn")}
          </Link>
          <Link
            href={`/${locale}/register`}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("getStarted")}
          </Link>
        </div>
      </div>
    </div>
  );
}
