"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { PageBuilderProvider } from "@/builder/providers/page-builder-context";
import { SectionBuilder } from "@/features/pages/section-builder";
import { DndPageBuilder } from "@/builder/dnd/dnd-page-builder";
import { LightEditor } from "@/features/pages/light-editor";
import type { Page } from "@/shared/types";
import { useState } from "react";
import { LayoutTemplate, MousePointerClick, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

type BuilderMode = "light" | "dnd" | "section";

const MODE_KEY = "page-builder-mode";

function getStoredMode(): BuilderMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === "light" || stored === "dnd" || stored === "section") return stored;
  } catch {}
  return "light";
}

export default function PageDetailPage() {
  const t = useTranslations("dashboard.pages");
  const params = useParams();
  const pageId = params.id as string;
  const [builderMode, setBuilderMode] = useState<BuilderMode>(getStoredMode);

  const handleModeChange = (mode: BuilderMode) => {
    setBuilderMode(mode);
    try { localStorage.setItem(MODE_KEY, mode); } catch {}
  };

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
        <p className="text-gray-500">{t("notFound")}</p>
      </div>
    );
  }

  const modes: { key: BuilderMode; label: string; icon: React.ElementType }[] = [
    { key: "light", label: t("lightEditor"), icon: Zap },
    { key: "dnd", label: t("dragDrop"), icon: MousePointerClick },
    { key: "section", label: t("sectionBuilder"), icon: LayoutTemplate },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{t("builderMode")}:</span>
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          {modes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                builderMode === key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <PageBuilderProvider page={page}>
        {builderMode === "light" ? (
          <LightEditor pageId={pageId} />
        ) : builderMode === "dnd" ? (
          <DndPageBuilder pageId={pageId} />
        ) : (
          <SectionBuilder pageId={pageId} />
        )}
      </PageBuilderProvider>
    </div>
  );
}
