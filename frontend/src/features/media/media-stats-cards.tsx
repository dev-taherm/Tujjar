"use client";

import { useMediaStats } from "@/api/queries";
import { Image, Film, FileText, HardDrive } from "lucide-react";

export function MediaStatsCards() {
  const { data: stats } = useMediaStats();
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {[
        { icon: Image, label: "Images", value: stats?.total_images || 0, color: "text-blue-600 bg-blue-50" },
        { icon: Film, label: "Videos", value: stats?.total_videos || 0, color: "text-purple-600 bg-purple-50" },
        { icon: FileText, label: "Documents", value: stats?.total_documents || 0, color: "text-green-600 bg-green-50" },
        { icon: HardDrive, label: "Total", value: stats?.total_assets || 0, color: "text-gray-600 bg-gray-50" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
