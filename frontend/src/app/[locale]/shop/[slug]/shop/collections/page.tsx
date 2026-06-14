"use client";

import { useTranslations } from "next-intl";

export default function CollectionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = useTranslations("storefront.collections");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
        {t("noCollections")}
      </div>
    </div>
  );
}
