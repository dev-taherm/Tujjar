"use client";

import { useState } from "react";
import { MediaGallery } from "@/features/media/media-gallery";
import { MediaStatsCards } from "@/features/media/media-stats-cards";
import { useTranslations } from "next-intl";

export default function MediaPage() {
  const t = useTranslations("dashboard.media");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500">{t("description")}</p>
      </div>
      <MediaStatsCards storeId={selectedStoreId || undefined} />
      <MediaGallery selectedStoreId={selectedStoreId} onStoreChange={setSelectedStoreId} />
    </div>
  );
}
