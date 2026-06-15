"use client";

import { useState } from "react";
import { Search, LayoutTemplate, Check, ExternalLink } from "lucide-react";
import { useTemplateMarketplace, useInstalledTemplate, useInstallTemplate } from "@/api/templates";
import type { Template } from "@/api/templates";
import { TemplateCard } from "./template-card";
import { TemplatePreview } from "./template-preview";
import { StoreSelectorDialog } from "./store-selector-dialog";
import { TEMPLATE_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

interface TemplateBrowserProps {
  storeId?: string;
}

export function TemplateBrowser({ storeId }: TemplateBrowserProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [storeDialogTemplate, setStoreDialogTemplate] = useState<Template | null>(null);

  const { data: installedTemplate, isLoading: loadingInstalled } = useInstalledTemplate(
    storeId ? (storeId as string) : null
  );
  const { data: marketplaceData, isLoading: loadingMarketplace } = useTemplateMarketplace(
    category || undefined
  );
  const installMutation = useInstallTemplate();
  const queryClient = useQueryClient();

  const marketplaceTemplates = (marketplaceData?.results || []).filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const handleInstallClick = (template: Template) => {
    setStoreDialogTemplate(template);
  };

  const handleConfirmInstall = async (selectedStoreId: string) => {
    if (!storeDialogTemplate) return;
    setInstallingId(storeDialogTemplate.id);
    try {
      const result = await installMutation.mutateAsync({
        templateId: storeDialogTemplate.id,
        storeId: selectedStoreId as string,
      });
      toast.success(`Template "${storeDialogTemplate.name}" installed! ${result.pages_created} pages created.`);
      setPreviewTemplate(null);
      setStoreDialogTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["templates", "installed"] });
    } catch {
      toast.error("Failed to install template. Please try again.");
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Installed Template ─────────────────────────────── */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-gray-900">{t("currentTemplate")}</h2>
        <p className="mb-4 text-sm text-gray-500">
          {storeId
            ? t("templateAppliedToStore")
            : t("selectStoreToSeeTemplate")}
        </p>

        {!storeId ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-12 text-center">
            <LayoutTemplate className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">{t("selectStoreFromSidebar")}</p>
          </div>
        ) : loadingInstalled ? (
          <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
        ) : installedTemplate ? (
          <div className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Check className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{installedTemplate.name}</h3>
              <p className="text-sm text-gray-500">
                v{installedTemplate.version} &middot; {installedTemplate.category} &middot;{" "}
                {installedTemplate.page_count} pages
              </p>
            </div>
            <button
              onClick={() => setPreviewTemplate(installedTemplate)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <ExternalLink className="h-4 w-4" />
              {t("viewDetails")}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 py-12 text-center">
            <LayoutTemplate className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">{t("noTemplateInstalled")}</p>
          </div>
        )}
      </section>

      {/* ── Marketplace ────────────────────────────────────── */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-gray-900">{t("browseTemplates")}</h2>
        <p className="mb-4 text-sm text-gray-500">
          {t("chooseReadyToUseTemplate")}
        </p>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  category === cat.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchTemplates")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 ps-9 pe-4 text-sm focus:border-blue-500 focus:outline-none sm:w-64"
            />
          </div>
        </div>

        {/* Grid */}
        {loadingMarketplace ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : marketplaceTemplates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
            <LayoutTemplate className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">{t("noTemplatesFound")}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {marketplaceTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={setPreviewTemplate}
                onInstall={handleInstallClick}
                isInstalling={installingId === template.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onInstall={handleInstallClick}
          isInstalling={installingId === previewTemplate.id}
        />
      )}

      {/* Store Selector Dialog */}
      <StoreSelectorDialog
        open={!!storeDialogTemplate}
        onClose={() => setStoreDialogTemplate(null)}
        onConfirm={handleConfirmInstall}
        title="Install Template"
        description={`Select a store to install "${storeDialogTemplate?.name || ""}" on.`}
        currentTemplateName={storeDialogTemplate?.name}
        isLoading={!!installingId}
      />
    </div>
  );
}
