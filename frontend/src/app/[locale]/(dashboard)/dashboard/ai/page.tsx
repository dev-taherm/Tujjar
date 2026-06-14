"use client";

import { useState } from "react";
import { AIAssistant } from "@/features/ai/ai-assistant";
import { ProductGenerator } from "@/features/ai/product-generator";
import { AIProviderConfig } from "@/features/ai/ai-provider-config";
import { Bot, Sparkles, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

type Tab = "assistant" | "generator" | "providers";

export default function AIPage() {
  const t = useTranslations("dashboard.ai");
  const [tab, setTab] = useState<Tab>("assistant");

  const tabs = [
    { key: "assistant" as Tab, label: t("tabAssistant"), icon: Bot },
    { key: "generator" as Tab, label: t("tabGenerator"), icon: Sparkles },
    { key: "providers" as Tab, label: t("tabProviders"), icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("description")}</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
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
