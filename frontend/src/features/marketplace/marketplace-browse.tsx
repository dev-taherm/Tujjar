"use client";

import { useState } from "react";
import { useThemeMarketplace, useInstallTheme, useTemplateMarketplace, useInstallTemplate } from "@/api/queries";
import { Badge, Button } from "@/shared/ui";
import { Palette, LayoutTemplate, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateCard } from "@/features/templates/template-card";
import type { Template } from "@/api/templates";
import type { Theme } from "@/shared/types";
import { TemplatePreview } from "@/features/templates/template-preview";
import { StoreSelectorDialog } from "@/features/templates/store-selector-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "themes" | "templates";

const TEMPLATE_CATEGORIES = [
  { value: "", label: "All" },
  { value: "fashion", label: "Fashion" },
  { value: "electronics", label: "Electronics" },
  { value: "restaurant", label: "Restaurant" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "furniture", label: "Furniture" },
];

/* ── Theme Card ────────────────────────────────────────────────────── */

function ThemeMarketplaceCard({ theme, isInstalling, onInstall }: {
  theme: Theme;
  isInstalling: boolean;
  onInstall: () => void;
}) {
  const colors = theme.config?.colors || {};
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg">
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="flex gap-2">
          {[colors.primary, colors.secondary, colors.accent].filter(Boolean).map((c, i) => (
            <div key={i} className="h-8 w-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{theme.name}</h3>
            <p className="text-xs text-gray-400">v{theme.version}</p>
          </div>
          {theme.is_system && <Badge variant="secondary">System</Badge>}
        </div>
        <p className="mb-3 text-sm text-gray-500">
          {theme.config?.typography?.headingFont || "Inter"} / {theme.config?.typography?.bodyFont || "Inter"}
        </p>
        <Button onClick={onInstall} disabled={isInstalling} className="w-full">
          {isInstalling ? "Installing..." : "Install Theme"}
        </Button>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

export function MarketplaceBrowse() {
  const [activeTab, setActiveTab] = useState<Tab>("themes");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("themes")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
              activeTab === "themes"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            )}
          >
            <Palette className="h-4 w-4" />
            Themes
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
              activeTab === "templates"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            )}
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>
        </nav>
      </div>

      {activeTab === "themes" ? (
        <ThemesTab />
      ) : (
        <TemplatesTab
          category={templateCategory}
          setCategory={setTemplateCategory}
          search={templateSearch}
          setSearch={setTemplateSearch}
          previewTemplate={previewTemplate}
          setPreviewTemplate={setPreviewTemplate}
        />
      )}
    </div>
  );
}

/* ── Themes Tab ────────────────────────────────────────────────────── */

function ThemesTab() {
  const { data: themes, isLoading } = useThemeMarketplace();
  const installTheme = useInstallTheme();
  const queryClient = useQueryClient();
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [dialogTheme, setDialogTheme] = useState<Theme | null>(null);

  const themeList = themes || [];

  const handleInstallClick = (theme: Theme) => {
    setDialogTheme(theme);
  };

  const handleConfirmInstall = async (storeId: string) => {
    if (!dialogTheme) return;
    setInstallingId(dialogTheme.id);
    try {
      await installTheme.mutateAsync({ id: dialogTheme.id, storeId });
      toast.success(`Theme "${dialogTheme.name}" installed!`);
      setDialogTheme(null);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    } catch {
      toast.error("Failed to install theme.");
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <>
      <div>
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : !themeList.length ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
            <Palette className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No themes available</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {themeList.map((theme) => (
              <ThemeMarketplaceCard
                key={theme.id}
                theme={theme}
                isInstalling={installingId === theme.id}
                onInstall={() => handleInstallClick(theme)}
              />
            ))}
          </div>
        )}
      </div>

      <StoreSelectorDialog
        open={!!dialogTheme}
        onClose={() => setDialogTheme(null)}
        onConfirm={handleConfirmInstall}
        title="Install Theme"
        description={`Select a store to install "${dialogTheme?.name || ""}" on.`}
        currentThemeName={dialogTheme?.name}
        isLoading={!!installingId}
      />
    </>
  );
}

/* ── Templates Tab ─────────────────────────────────────────────────── */

function TemplatesTab({
  category,
  setCategory,
  search,
  setSearch,
  previewTemplate,
  setPreviewTemplate,
}: {
  category: string;
  setCategory: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  previewTemplate: Template | null;
  setPreviewTemplate: (t: Template | null) => void;
}) {
  const { data, isLoading } = useTemplateMarketplace(category || undefined);
  const installMutation = useInstallTemplate();
  const queryClient = useQueryClient();
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [dialogTemplate, setDialogTemplate] = useState<Template | null>(null);

  const templates = (data?.results || []).filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const handleInstallClick = (template: Template) => {
    setDialogTemplate(template);
  };

  const handleConfirmInstall = async (storeId: string) => {
    if (!dialogTemplate) return;
    setInstallingId(dialogTemplate.id);
    try {
      const result = await installMutation.mutateAsync({
        templateId: dialogTemplate.id,
        storeId: storeId as string,
      });
      toast.success(`Template "${dialogTemplate.name}" installed! ${result.pages_created} pages created.`);
      setPreviewTemplate(null);
      setDialogTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    } catch {
      toast.error("Failed to install template.");
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  category === cat.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none sm:w-64"
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
            <LayoutTemplate className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No templates found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
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
      </div>

      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onInstall={handleInstallClick}
          isInstalling={installingId === previewTemplate.id}
        />
      )}

      <StoreSelectorDialog
        open={!!dialogTemplate}
        onClose={() => setDialogTemplate(null)}
        onConfirm={handleConfirmInstall}
        title="Install Template"
        description={`Select a store to install "${dialogTemplate?.name || ""}" on.`}
        currentTemplateName={dialogTemplate?.name}
        isLoading={!!installingId}
      />
    </>
  );
}
