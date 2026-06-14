"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { PageBuilderProvider } from "@/builder/providers/page-builder-context";
import { SectionBuilder } from "@/features/pages/section-builder";
import { DndPageBuilder } from "@/builder/dnd/dnd-page-builder";
import type { Page } from "@/shared/types";
import { useState } from "react";
import { LayoutTemplate, MousePointerClick } from "lucide-react";
import { useTranslations } from "next-intl";

type BuilderMode = "section" | "dnd";

export default function PageDetailPage() {
  const t = useTranslations("dashboard.pages");
  const params = useParams();
  const pageId = params.id as string;
  const [builderMode, setBuilderMode] = useState<BuilderMode>("dnd");

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["pages", pageId],
    queryFn: async (): Promise<Page> => {
      const { data } = await apiClient.get(`/pages/${pageId}/`);
      return data;
    },
    enabled: !!pageId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-[600px] animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">{t("pageNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Builder mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{t("builderMode")}:</span>
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            onClick={() => setBuilderMode("dnd")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              builderMode === "dnd" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MousePointerClick className="h-3.5 w-3.5" />
            {t("dragDrop")}
          </button>
          <button
            onClick={() => setBuilderMode("section")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              builderMode === "section" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            {t("sectionBuilder")}
          </button>
        </div>
      </div>

      <PageBuilderProvider page={page}>
        {builderMode === "dnd" ? (
          <DndPageBuilder pageId={pageId} />
        ) : (
          <SectionBuilder pageId={pageId} />
        )}
      </PageBuilderProvider>
    </div>
  );
}
