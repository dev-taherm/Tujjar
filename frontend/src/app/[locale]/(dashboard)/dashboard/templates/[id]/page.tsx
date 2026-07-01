"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTemplate, useUpdateTemplate } from "@/api/queries";
import { TemplateGeneralEditor } from "@/features/templates/template-general-editor";
import { TemplatePagesEditor } from "@/features/templates/template-pages-editor";
import { TemplateNavigationEditor } from "@/features/templates/template-navigation-editor";
import { TemplateFooterEditor } from "@/features/templates/template-footer-editor";
import { TemplateVersionHistory } from "@/features/templates/template-version-history";
import { ThemeColorEditor } from "@/features/themes/theme-color-editor";
import { ThemeTypographyEditor } from "@/features/themes/theme-typography-editor";
import { Button, Skeleton, Input, Label, Textarea } from "@/shared/ui";
import { Save, ArrowLeft, History, Eye } from "lucide-react";
import { toast } from "sonner";
import type { Template } from "@/api/templates";
import type { ThemeConfig } from "@/shared/types";

type EditorTab = "general" | "theme" | "pages" | "navigation" | "footer" | "seo" | "demo";

const EDITOR_TABS: { id: EditorTab; labelKey: string }[] = [
  { id: "general", labelKey: "general" },
  { id: "theme", labelKey: "themeConfig" },
  { id: "pages", labelKey: "pages" },
  { id: "navigation", labelKey: "navigation" },
  { id: "footer", labelKey: "footer" },
  { id: "seo", labelKey: "seo" },
  { id: "demo", labelKey: "demoContent" },
];

export default function TemplateEditorPage() {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const templateId = params.id as string;

  const { data: template, isLoading } = useTemplate(templateId);
  const updateTemplate = useUpdateTemplate();
  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Local editable state
  const [generalData, setGeneralData] = useState<Partial<Template>>({});
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [pages, setPages] = useState<Template["pages"]>([]);
  const [navigation, setNavigation] = useState<Template["navigation"]>({ logo_text: "", links: [] });
  const [footer, setFooter] = useState<Template["footer"]>({ columns: [], copyright: "", social_links: {} });
  const [seoDefaults, setSeoDefaults] = useState<Record<string, string>>({});
  const [demoContent, setDemoContent] = useState<Template["demo_content"]>({ collections: [], categories: [] });
  const [initialized, setInitialized] = useState(false);

  if (template && !initialized) {
    setInitialized(true);
    setGeneralData({
      name: template.name,
      slug: template.slug,
      description: template.description,
      category: template.category,
      author: template.author,
      tags: template.tags,
    });
    setConfig(template.config as Record<string, unknown>);
    setPages(template.pages);
    setNavigation(template.navigation);
    setFooter(template.footer);
    setSeoDefaults(template.seo_defaults as Record<string, string>);
    setDemoContent(template.demo_content);
  }

  const handleSave = async () => {
    if (!template) return;
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        ...generalData,
        config,
        pages,
        navigation,
        footer,
        seo_defaults: seoDefaults,
        demo_content: demoContent,
      } as never);
      toast.success(t("templateSaved"));
    } catch {
      toast.error("Failed to save template");
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("templateEditor")}</h1>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!template) {
    return <div>Template not found</div>;
  }

  const themeConfig = config as unknown as ThemeConfig;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/dashboard/templates`)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{generalData.name || template.name}</h1>
            <p className="text-sm text-gray-500">v{template.version} &middot; {template.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowVersionHistory(true)}>
            <History className="me-2 h-4 w-4" />
            {t("versionHistory")}
          </Button>
          <Button onClick={handleSave} isLoading={updateTemplate.isPending}>
            <Save className="me-2 h-4 w-4" />
            {tc("saveChanges")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editor (left) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-4 overflow-x-auto">
              {EDITOR_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            {activeTab === "general" && (
              <TemplateGeneralEditor data={generalData} onChange={setGeneralData} />
            )}
            {activeTab === "theme" && (
              <div className="space-y-6">
                <ThemeColorEditor
                  colors={themeConfig.colors || { primary: "#3B82F6", secondary: "#10B981", accent: "#F59E0B", background: "#FFFFFF", text: "#111827", textSecondary: "#6B7280", border: "#E5E7EB", surface: "#F9FAFB", error: "#EF4444", success: "#10B981", warning: "#F59E0B" }}
                  onChange={(colors) => setConfig({ ...config, colors })}
                />
                <ThemeTypographyEditor
                  typography={themeConfig.typography || { headingFont: "Inter", bodyFont: "Inter", baseFontSize: 16, scale: 1.25, lineHeight: 1.5 }}
                  onChange={(typography) => setConfig({ ...config, typography })}
                />
              </div>
            )}
            {activeTab === "pages" && (
              <TemplatePagesEditor pages={pages} onChange={setPages} />
            )}
            {activeTab === "navigation" && (
              <TemplateNavigationEditor data={{ ...navigation, links: navigation?.links || [] }} onChange={setNavigation} />
            )}
            {activeTab === "footer" && (
              <TemplateFooterEditor data={{ ...footer, columns: footer?.columns || [] }} onChange={setFooter} />
            )}
            {activeTab === "seo" && (
              <div className="space-y-4">
                <div>
                  <Label>{t("titlePattern")}</Label>
                  <Input
                    value={seoDefaults.title_pattern || ""}
                    onChange={(e) => setSeoDefaults({ ...seoDefaults, title_pattern: e.target.value })}
                    placeholder="{{page_title}} | {{store_name}}"
                  />
                  <p className="mt-1 text-xs text-gray-400">Use {"{{page_title}}"} and {"{{store_name}}"} as placeholders</p>
                </div>
                <div>
                  <Label>{t("descriptionPattern")}</Label>
                  <Textarea
                    value={seoDefaults.description_pattern || ""}
                    onChange={(e) => setSeoDefaults({ ...seoDefaults, description_pattern: e.target.value })}
                    placeholder="Default meta description for {{page_title}}"
                    rows={3}
                  />
                </div>
              </div>
            )}
            {activeTab === "demo" && (
              <div className="space-y-6">
                {/* Collections */}
                <div>
                  <Label>Collections</Label>
                  <div className="mt-2 space-y-2">
                    {(demoContent?.collections || []).map((coll, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                        <Input
                          value={coll.name}
                          onChange={(e) => {
                            const collections = [...demoContent.collections];
                            collections[i] = { ...collections[i], name: e.target.value };
                            setDemoContent({ ...demoContent, collections });
                          }}
                          placeholder="Collection name"
                          className="flex-1"
                        />
                        <Input
                          value={coll.slug}
                          onChange={(e) => {
                            const collections = [...demoContent.collections];
                            collections[i] = { ...collections[i], slug: e.target.value };
                            setDemoContent({ ...demoContent, collections });
                          }}
                          placeholder="slug"
                          className="flex-1"
                        />
                        <button
                          onClick={() => setDemoContent({
                            ...demoContent,
                            collections: demoContent.collections.filter((_, j) => j !== i),
                          })}
                          className="rounded p-1 text-red-400 hover:bg-red-50"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setDemoContent({
                        ...demoContent,
                        collections: [...(demoContent?.collections || []), { name: "", slug: "" }],
                      })}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      + Add Collection
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <Label>Categories</Label>
                  <div className="mt-2 space-y-2">
                    {(demoContent?.categories || []).map((cat, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                        <Input
                          value={cat.name}
                          onChange={(e) => {
                            const categories = [...demoContent.categories];
                            categories[i] = { ...categories[i], name: e.target.value };
                            setDemoContent({ ...demoContent, categories });
                          }}
                          placeholder="Category name"
                          className="flex-1"
                        />
                        <Input
                          value={cat.slug}
                          onChange={(e) => {
                            const categories = [...demoContent.categories];
                            categories[i] = { ...categories[i], slug: e.target.value };
                            setDemoContent({ ...demoContent, categories });
                          }}
                          placeholder="slug"
                          className="flex-1"
                        />
                        <button
                          onClick={() => setDemoContent({
                            ...demoContent,
                            categories: demoContent.categories.filter((_, j) => j !== i),
                          })}
                          className="rounded p-1 text-red-400 hover:bg-red-50"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setDemoContent({
                        ...demoContent,
                        categories: [...(demoContent?.categories || []), { name: "", slug: "" }],
                      })}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      + Add Category
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview panel (right) */}
        <div>
          <div className="sticky top-8 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Preview</h3>
              {themeConfig.colors && (
                <div className="mb-3 flex gap-1.5">
                  {[themeConfig.colors.primary, themeConfig.colors.secondary, themeConfig.colors.accent, themeConfig.colors.background, themeConfig.colors.text]
                    .filter(Boolean)
                    .map((color, i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                </div>
              )}
              <div className="space-y-1.5 text-xs text-gray-500">
                <p>Pages: <span className="font-medium text-gray-700">{pages.length}</span></p>
                <p>Navigation: <span className="font-medium text-gray-700">{navigation?.links?.length ?? 0} links</span></p>
                <p>Footer: <span className="font-medium text-gray-700">{footer?.columns?.length ?? 0} columns</span></p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`/${template.slug}/shop/`, "_blank")}
            >
              <Eye className="me-2 h-4 w-4" />
              Preview Store
            </Button>
          </div>
        </div>
      </div>

      {/* Version History Dialog */}
      {showVersionHistory && (
        <TemplateVersionHistory
          templateId={templateId}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
}
