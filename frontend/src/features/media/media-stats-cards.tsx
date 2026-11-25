"use client";

import { useMediaStats } from "@/api/queries";
import { Image, Film, FileText, HardDrive } from "lucide-react";
import { useTranslations } from "next-intl";

interface MediaStatsCardsProps {
  storeId?: string;
}

export function MediaStatsCards({ storeId }: MediaStatsCardsProps) {
  const t = useTranslations("dashboard.media");
  const { data: stats } = useMediaStats(storeId);
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {[
        { icon: Image, label: t("images"), value: stats?.total_images || 0, color: "text-primary-600 bg-primary-50" },
        { icon: Film, label: t("videos"), value: stats?.total_videos || 0, color: "text-purple-600 bg-purple-50" },
        { icon: FileText, label: "Documents", value: stats?.total_documents || 0, color: "text-success bg-success-soft" },
        { icon: HardDrive, label: "Total", value: stats?.total_assets || 0, color: "text-ink-soft bg-rail" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-line p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-ink-soft">{s.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
