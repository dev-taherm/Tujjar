"use client";

import { useState } from "react";
import { AIAssistant } from "@/features/ai/ai-assistant";
import { ProductGenerator } from "@/features/ai/product-generator";
import { AIProviderConfig } from "@/features/ai/ai-provider-config";
import { Bot, Sparkles, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/ui";

type Tab = "assistant" | "generator" | "providers";

export default function AIPage() {
  const t = useTranslations("dashboard.ai");
  const [tab, setTab] = useState<Tab>("assistant");

  const tabs = [
    { key: "assistant" as Tab, label: t("tabs.assistant"), icon: Bot },
    { key: "generator" as Tab, label: t("tabs.generator"), icon: Sparkles },
    { key: "providers" as Tab, label: t("tabs.providers"), icon: Settings },
  ];

  return (
    <div className="space-y-6">
              <PageHeader title={t("title")} description={t("description")} />

      <div className="flex gap-1 rounded-lg border border-line bg-panel p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-primary-600 text-white" : "text-ink-soft hover:bg-rail"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "assistant" && <AIAssistant />}
      {tab === "generator" && <ProductGenerator />}
      {tab === "providers" && <AIProviderConfig />}
    </div>
  );
}
