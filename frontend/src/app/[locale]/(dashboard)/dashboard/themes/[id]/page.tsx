"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTheme, useUpdateTheme } from "@/api/queries";
import { useStores, useSetTheme } from "@/api/queries";
import type { ThemeConfig } from "@/shared/types";
import { ThemeColorEditor } from "@/features/themes/theme-color-editor";
import { ThemeTypographyEditor } from "@/features/themes/theme-typography-editor";
import { ThemeSpacingEditor } from "@/features/themes/theme-spacing-editor";
import { ThemeBorderRadiusEditor } from "@/features/themes/theme-border-radius-editor";
import { ThemeAnimationsEditor } from "@/features/themes/theme-animations-editor";
import { ThemeDarkModeEditor } from "@/features/themes/theme-darkmode-editor";
import { Button, Card, CardHeader, CardTitle, CardContent, Skeleton } from "@/shared/ui";
import { Save, Eye, Paintbrush, Monitor, Tablet, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type EditorTab = "colors" | "typography" | "spacing" | "radius" | "animations" | "darkmode";

type DeviceSize = "desktop" | "tablet" | "mobile";
const DEVICE_WIDTHS: Record<DeviceSize, string> = { desktop: "100%", tablet: "768px", mobile: "375px" };

export default function ThemeDetailPage() {
  const t = useTranslations("dashboard.themes");
  const tc = useTranslations("common");
  const params = useParams();
  const { data: theme, isLoading } = useTheme(params.id as string);
  const { data: parentTheme } = useTheme(theme?.parent_theme || "");
  const updateTheme = useUpdateTheme();
  const setTheme = useSetTheme();
  const { data: stores } = useStores();
  const activeStore = stores?.[0];
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("colors");
  const [previewDevice, setPreviewDevice] = useState<DeviceSize>("desktop");

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("themeEditor")}</h1>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!theme) {
    return <div>{t("notFound")}</div>;
  }

  const activeConfig = (config as unknown as ThemeConfig) || theme.config;

  const handleSave = async () => {
    if (!config) return;
    await updateTheme.mutateAsync({
      id: theme.id,
      config: config as unknown as ThemeConfig,
    });
  };

  const handleApplyToStore = async () => {
    if (!activeStore) return;
    await setTheme.mutateAsync({ storeId: activeStore.id, themeId: theme.id });
    toast.success(t("themeApplied") || "Theme applied to store");
  };

  const handlePreview = () => {
    if (!activeStore) return;
    window.open(`/${activeStore.slug}/shop/?preview_theme=${theme.id}`, "_blank");
  };

  const isApplied = activeStore?.theme === theme.id;

  const EDITOR_TABS: { id: EditorTab; label: string }[] = [
    { id: "colors", label: t("colors") },
    { id: "typography", label: t("typography") },
    { id: "spacing", label: t("spacing") },
    { id: "radius", label: t("borderRadius") || "Border Radius" },
    { id: "animations", label: t("animations") || "Animations" },
    { id: "darkmode", label: t("darkMode") || "Dark Mode" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{theme.name}</h1>
          <p className="text-sm text-gray-500">v{theme.version} {theme.is_system ? `• ${t("systemTheme")}` : ""}</p>
          {parentTheme && (
            <p className="mt-1 text-xs text-gray-400">
              Inherits from <span className="font-medium text-gray-600">{parentTheme.name}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="me-2 h-4 w-4" />
            {tc("preview")}
          </Button>
          {activeStore && !isApplied && (
            <Button variant="outline" onClick={handleApplyToStore} isLoading={setTheme.isPending}>
              <Paintbrush className="me-2 h-4 w-4" />
              {t("applyToStore") || "Apply to Store"}
            </Button>
          )}
          <Button onClick={handleSave} isLoading={updateTheme.isPending} disabled={!config}>
            <Save className="me-2 h-4 w-4" />
            {tc("saveChanges")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
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
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <Card>
            <CardContent className="pt-6">
              {activeTab === "colors" && (
                <ThemeColorEditor
                  colors={activeConfig.colors}
                  onChange={(colors) => setConfig({ ...activeConfig, colors })}
                  parentColors={parentTheme?.config?.colors}
                />
              )}
              {activeTab === "typography" && (
                <ThemeTypographyEditor
                  typography={activeConfig.typography}
                  onChange={(typography) => setConfig({ ...activeConfig, typography })}
                  parentTypography={parentTheme?.config?.typography}
                />
              )}
              {activeTab === "spacing" && (
                <ThemeSpacingEditor
                  spacing={activeConfig.spacing}
                  onChange={(spacing) => setConfig({ ...activeConfig, spacing })}
                  parentSpacing={parentTheme?.config?.spacing}
                />
              )}
              {activeTab === "radius" && (
                <ThemeBorderRadiusEditor
                  borderRadius={activeConfig.borderRadius}
                  onChange={(borderRadius) => setConfig({ ...activeConfig, borderRadius })}
                  parentBorderRadius={parentTheme?.config?.borderRadius}
                />
              )}
              {activeTab === "animations" && (
                <ThemeAnimationsEditor
                  animations={activeConfig.animations}
                  onChange={(animations) => setConfig({ ...activeConfig, animations })}
                  parentAnimations={parentTheme?.config?.animations}
                />
              )}
              {activeTab === "darkmode" && (
                <ThemeDarkModeEditor
                  darkMode={activeConfig.darkMode}
                  onChange={(darkMode) => setConfig({ ...activeConfig, darkMode })}
                  parentDarkMode={parentTheme?.config?.darkMode}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("preview")}</CardTitle>
                <div className="flex gap-1">
                  {([
                    { id: "desktop" as const, icon: Monitor },
                    { id: "tablet" as const, icon: Tablet },
                    { id: "mobile" as const, icon: Smartphone },
                  ]).map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPreviewDevice(id)}
                      className={`rounded p-1.5 transition-colors ${
                        previewDevice === id
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                      title={id}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeStore ? (
                  <div
                    className="mx-auto overflow-hidden rounded-lg border border-gray-200 transition-all duration-300"
                    style={{ maxWidth: DEVICE_WIDTHS[previewDevice] }}
                  >
                    <iframe
                      src={`/${activeStore.slug}/shop/?preview_theme=${theme.id}`}
                      className="h-[400px] w-full border-0"
                      title="Theme Preview"
                    />
                  </div>
                ) : (
                  <div
                    className="rounded-lg p-6"
                    style={{ backgroundColor: activeConfig.colors.background }}
                  >
                    <h3
                      className="mb-2 text-lg font-bold"
                      style={{ color: activeConfig.colors.text, fontFamily: activeConfig.typography.headingFont }}
                    >
                      {t("sampleHeading")}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: activeConfig.colors.textSecondary, fontFamily: activeConfig.typography.bodyFont }}
                    >
                      {t("previewDescription")}
                    </p>
                    <button
                      className="mt-4 px-4 py-2 text-sm font-medium text-white"
                      style={{
                        backgroundColor: activeConfig.colors.primary,
                        borderRadius: `${activeConfig.borderRadius.medium}px`,
                      }}
                    >
                      {t("primaryButton")}
                    </button>
                  </div>
                )}
                <div className="flex gap-1">
                  {Object.entries(activeConfig.colors).slice(0, 6).map(([key, color]) => (
                    <div
                      key={key}
                      className="h-8 w-8 rounded-full border border-gray-200"
                      style={{ backgroundColor: color as string }}
                      title={key}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
