"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from "@/shared/ui";
import { Toggle } from "@/shared/components/toggle";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import { useUpdateStore } from "@/api/queries";
import { usePages } from "@/api/pages";
import { TemplateBrowser } from "@/features/templates/template-browser";
import type { Store } from "@/shared/types";
import {
  Settings,
  LayoutTemplate,
  Palette,
  FileText,
  Globe,
  ExternalLink,
  Plus,
  Trash2,
  GripVertical,
  Navigation,
} from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

type TabId = "general" | "navigation" | "template" | "theme" | "pages";

interface StoreSettingsFormProps {
  store: Store;
}

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const t = useTranslations("storeSettings");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const TABS: { id: TabId; label: string; icon: typeof Settings }[] = [
    { id: "general", label: t("tabs.general"), icon: Settings },
    { id: "navigation", label: t("tabs.navigation") || "Navigation", icon: Navigation },
    { id: "template", label: t("tabs.template"), icon: LayoutTemplate },
    { id: "theme", label: t("tabs.theme"), icon: Palette },
    { id: "pages", label: t("tabs.pages"), icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "general" && <GeneralTab store={store} />}
      {activeTab === "navigation" && <NavigationTab store={store} />}
      {activeTab === "template" && <TemplateTab store={store} />}
      {activeTab === "theme" && <ThemeTab store={store} />}
      {activeTab === "pages" && <PagesTab store={store} locale={locale} />}
    </div>
  );
}

/* ── General Tab ─────────────────────────────────────────────────────── */

function GeneralTab({ store }: { store: Store }) {
  const t = useTranslations("storeSettings.general");
  const updateStore = useUpdateStore();
  const [editLocale, setEditLocale] = useState("en");

  const getTranslation = (field: string) => {
    if (editLocale === "en") return "";
    return (store.translations?.[editLocale] as Record<string, string>)?.[field] || "";
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: editLocale === "en" ? store.name : getTranslation("name"),
      description: editLocale === "en" ? store.description : getTranslation("description"),
      seo_title: editLocale === "en" ? store.seo_title : getTranslation("seo_title"),
      seo_description: editLocale === "en" ? store.seo_description : getTranslation("seo_description"),
    },
  });

  const handleLocaleChange = useCallback(
    (newLocale: string) => {
      setEditLocale(newLocale);
      if (newLocale === "en") {
        setValue("name", store.name);
        setValue("description", store.description);
        setValue("seo_title", store.seo_title);
        setValue("seo_description", store.seo_description);
      } else {
        const t = store.translations?.[newLocale] as Record<string, string> | undefined;
        setValue("name", t?.name || "");
        setValue("description", t?.description || "");
        setValue("seo_title", t?.seo_title || "");
        setValue("seo_description", t?.seo_description || "");
      }
    },
    [store, setValue]
  );

  const onSubmit = async (data: SettingsForm) => {
    if (editLocale === "en") {
      await updateStore.mutateAsync({ id: store.id, ...data });
    } else {
      const currentTranslations = store.translations || {};
      const localeData = currentTranslations[editLocale] || {};
      await updateStore.mutateAsync({
        id: store.id,
        translations: {
          ...currentTranslations,
          [editLocale]: { ...localeData, ...data },
        },
      });
    }
  };

  const descriptionPlaceholder = editLocale === "en"
    ? t("descriptionPlaceholder")
    : `Enter ${editLocale === "ar" ? "Arabic" : editLocale} description...`;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("title")}</CardTitle>
            <LocaleToggle value={editLocale} onChange={handleLocaleChange} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editLocale !== "en" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              Editing {editLocale === "ar" ? "Arabic" : editLocale} translations. English values are used as fallback.
            </div>
          )}
          <Input
            label={t("storeName")}
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label={t("description")}
            placeholder={descriptionPlaceholder}
            {...register("description")}
          />
          <Input
            label={t("seoTitle")}
            placeholder={editLocale !== "en" ? `SEO title in ${editLocale === "ar" ? "Arabic" : editLocale}...` : t("seoTitlePlaceholder")}
            {...register("seo_title")}
          />
          <Input
            label={t("seoDescription")}
            placeholder={editLocale !== "en" ? `SEO description in ${editLocale === "ar" ? "Arabic" : editLocale}...` : t("seoDescriptionPlaceholder")}
            {...register("seo_description")}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
              {t("saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

/* ── Navigation Tab ──────────────────────────────────────────────────── */

interface NavLink {
  label: string | Record<string, string>;
  url: string;
  order?: number;
}

interface NavigationData {
  logo_text?: string | Record<string, string>;
  links?: NavLink[];
  cta_button?: { label: string | Record<string, string>; url: string; enabled: boolean };
}

interface FooterColumn {
  title: string | Record<string, string>;
  links: { label: string | Record<string, string>; url: string }[];
}

interface FooterData {
  columns?: FooterColumn[];
  copyright?: string | Record<string, string>;
  social_links?: Record<string, string>;
}

function NavigationTab({ store }: { store: Store }) {
  const t = useTranslations("storeSettings");
  const updateStore = useUpdateStore();
  const [editLocale, setEditLocale] = useState("en");

  const nav: NavigationData = store.navigation || {};
  const footer: FooterData = store.footer_config || {};

  const [navData, setNavData] = useState<NavigationData>({
    logo_text: nav.logo_text || "",
    links: nav.links || [],
    cta_button: nav.cta_button || { label: "", url: "", enabled: false },
  });

  const [footerData, setFooterData] = useState<FooterData>({
    columns: footer.columns || [],
    copyright: footer.copyright || "",
    social_links: footer.social_links || {},
  });

  const getNavLabel = (label: string | Record<string, string>) => {
    if (typeof label === "string") return label;
    if (editLocale === "en") return label.en || "";
    return label[editLocale] || label.en || "";
  };

  const getFooterTitle = (title: string | Record<string, string>) => {
    if (typeof title === "string") return title;
    if (editLocale === "en") return title.en || "";
    return title[editLocale] || title.en || "";
  };

  const updateNavLink = (index: number, field: string, value: string) => {
    setNavData((prev) => {
      const links = [...(prev.links || [])];
      const link = { ...links[index] };
      if (field === "label" && editLocale !== "en") {
        const currentLabel: Record<string, string> = typeof link.label === "string" ? { en: link.label } : { ...(link.label as Record<string, string>) };
        currentLabel[editLocale] = value;
        link.label = currentLabel;
      } else {
        (link as Record<string, unknown>)[field] = value;
      }
      links[index] = link;
      return { ...prev, links };
    });
  };

  const addNavLink = () => {
    setNavData((prev) => ({
      ...prev,
      links: [...(prev.links || []), { label: "", url: "/", order: (prev.links?.length || 0) }],
    }));
  };

  const removeNavLink = (index: number) => {
    setNavData((prev) => ({
      ...prev,
      links: (prev.links || []).filter((_, i) => i !== index),
    }));
  };

  const updateFooterColumnTitle = (colIndex: number, value: string) => {
    setFooterData((prev) => {
      const columns = [...(prev.columns || [])];
      const col = { ...columns[colIndex] };
      if (editLocale !== "en") {
        const currentTitle: Record<string, string> = typeof col.title === "string" ? { en: col.title } : { ...(col.title as Record<string, string>) };
        currentTitle[editLocale] = value;
        col.title = currentTitle;
      } else {
        col.title = value;
      }
      columns[colIndex] = col;
      return { ...prev, columns };
    });
  };

  const addFooterColumn = () => {
    setFooterData((prev) => ({
      ...prev,
      columns: [...(prev.columns || []), { title: "", links: [] }],
    }));
  };

  const removeFooterColumn = (index: number) => {
    setFooterData((prev) => ({
      ...prev,
      columns: (prev.columns || []).filter((_, i) => i !== index),
    }));
  };

  const updateFooterLink = (colIndex: number, linkIndex: number, field: string, value: string) => {
    setFooterData((prev) => {
      const columns = [...(prev.columns || [])];
      const col = { ...columns[colIndex] };
      const links = [...col.links];
      const link = { ...links[linkIndex] };
      if (field === "label" && editLocale !== "en") {
        const currentLabel: Record<string, string> = typeof link.label === "string" ? { en: link.label } : { ...(link.label as Record<string, string>) };
        currentLabel[editLocale] = value;
        link.label = currentLabel;
      } else {
        (link as Record<string, unknown>)[field] = value;
      }
      links[linkIndex] = link;
      col.links = links;
      columns[colIndex] = col;
      return { ...prev, columns };
    });
  };

  const addFooterLink = (colIndex: number) => {
    setFooterData((prev) => {
      const columns = [...(prev.columns || [])];
      const col = { ...columns[colIndex] };
      col.links = [...col.links, { label: "", url: "/" }];
      columns[colIndex] = col;
      return { ...prev, columns };
    });
  };

  const removeFooterLink = (colIndex: number, linkIndex: number) => {
    setFooterData((prev) => {
      const columns = [...(prev.columns || [])];
      const col = { ...columns[colIndex] };
      col.links = col.links.filter((_, i) => i !== linkIndex);
      columns[colIndex] = col;
      return { ...prev, columns };
    });
  };

  const handleSaveNav = async () => {
    await updateStore.mutateAsync({
      id: store.id,
      navigation: {
        logo_text: navData.logo_text || "",
        links: (navData.links || []).map((l, i) => ({
          label: l.label || "",
          url: l.url,
          order: l.order ?? i,
        })),
        cta_button: navData.cta_button,
      } as Store["navigation"],
    });
  };

  const handleSaveFooter = async () => {
    await updateStore.mutateAsync({
      id: store.id,
      footer_config: {
        columns: (footerData.columns || []).map((col) => ({
          title: col.title || "",
          links: col.links.map((l) => ({
            label: l.label || "",
            url: l.url,
          })),
        })),
        copyright: footerData.copyright || "",
        social_links: footerData.social_links || {},
      } as Store["footer_config"],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Navigation & Footer</h3>
        <LocaleToggle value={editLocale} onChange={setEditLocale} />
      </div>

      {editLocale !== "en" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          Editing {editLocale === "ar" ? "Arabic" : editLocale} labels. English values are used as fallback.
        </div>
      )}

      {/* Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Logo Text"
              value={getNavLabel(navData.logo_text || "")}
              onChange={(e) => {
                const val = e.target.value;
                setNavData((prev) => {
                  const current = prev.logo_text || "";
                  if (editLocale !== "en") {
                    const nested: Record<string, string> = typeof current === "string" ? { en: current } : { ...(current as Record<string, string>) };
                    nested[editLocale] = val;
                    return { ...prev, logo_text: nested };
                  }
                  return { ...prev, logo_text: val };
                });
              }}
              className="flex-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Links</span>
            <Button variant="outline" size="sm" onClick={addNavLink}>
              <Plus className="me-1 h-4 w-4" /> Add Link
            </Button>
          </div>
          {navData.links?.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-300" />
              <Input
                placeholder="Label"
                value={getNavLabel(link.label)}
                onChange={(e) => updateNavLink(index, "label", e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="URL"
                value={link.url}
                onChange={(e) => updateNavLink(index, "url", e.target.value)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeNavLink(index)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveNav} isLoading={updateStore.isPending}>
              Save Navigation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CTA Button */}
      <Card>
        <CardHeader>
          <CardTitle>Call-to-Action Button</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Enabled" enabled={!!navData.cta_button?.enabled} onToggle={() =>
                setNavData((prev) => ({
                  ...prev,
                  cta_button: { ...prev.cta_button!, enabled: !prev.cta_button?.enabled },
                }))
              } />
          {navData.cta_button?.enabled && (
            <div className="flex gap-2">
              <Input
                placeholder="Button Label"
                value={getNavLabel(navData.cta_button?.label || "")}
                onChange={(e) => {
                  const val = e.target.value;
                  setNavData((prev) => {
                    const currentLabel = prev.cta_button?.label || "";
                    let newLabel: string | Record<string, string>;
                    if (editLocale !== "en") {
                      const nested: Record<string, string> = typeof currentLabel === "string" ? { en: currentLabel } : { ...(currentLabel as Record<string, string>) };
                      nested[editLocale] = val;
                      newLabel = nested;
                    } else {
                      newLabel = val;
                    }
                    return { ...prev, cta_button: { ...prev.cta_button!, label: newLabel } };
                  });
                }}
                className="flex-1"
              />
              <Input
                placeholder="Button URL"
                value={navData.cta_button?.url || ""}
                onChange={(e) =>
                  setNavData((prev) => ({
                    ...prev,
                    cta_button: { ...prev.cta_button!, url: e.target.value },
                  }))
                }
                className="flex-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Footer Columns</CardTitle>
            <Button variant="outline" size="sm" onClick={addFooterColumn}>
              <Plus className="me-1 h-4 w-4" /> Add Column
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {footerData.columns?.map((col, colIndex) => (
            <div key={colIndex} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Input
                  placeholder="Column Title"
                  value={getFooterTitle(col.title)}
                  onChange={(e) => updateFooterColumnTitle(colIndex, e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={() => addFooterLink(colIndex)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => removeFooterColumn(colIndex)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {col.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="flex items-center gap-2">
                    <Input
                      placeholder="Label"
                      value={getFooterTitle(link.label)}
                      onChange={(e) => updateFooterLink(colIndex, linkIndex, "label", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateFooterLink(colIndex, linkIndex, "url", e.target.value)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeFooterLink(colIndex, linkIndex)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Input
            placeholder="Copyright text"
            value={getFooterTitle(footerData.copyright || "")}
            onChange={(e) => {
              const val = e.target.value;
              setFooterData((prev) => {
                const current = prev.copyright || "";
                if (editLocale !== "en") {
                  const nested: Record<string, string> = typeof current === "string" ? { en: current } : { ...(current as Record<string, string>) };
                  nested[editLocale] = val;
                  return { ...prev, copyright: nested };
                }
                return { ...prev, copyright: val };
              });
            }}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveFooter} isLoading={updateStore.isPending}>
              Save Footer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Template Tab ────────────────────────────────────────────────────── */

function TemplateTab({ store }: { store: Store }) {
  const t = useTranslations("storeSettings.template");

  return (
    <div>
      {store.template && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {t("description")}
            </p>
          </CardContent>
        </Card>
      )}
      <TemplateBrowser storeId={store.id} />
    </div>
  );
}

/* ── Theme Tab ───────────────────────────────────────────────────────── */

function ThemeTab({ store }: { store: Store }) {
  const t = useTranslations("storeSettings.theme");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          {store.theme ? t("description") : t("noTheme")}
        </p>
      </CardContent>
    </Card>
  );
}

/* ── Pages Tab ───────────────────────────────────────────────────────── */

function PagesTab({ store, locale }: { store: Store; locale: string }) {
  const t = useTranslations("storeSettings.pages");
  const tCommon = useTranslations("common");
  const { data: pages, isLoading } = usePages(store.id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Link href={`/${locale}/dashboard/pages`}>
            <Button variant="outline" size="sm">
              <FileText className="me-2 h-4 w-4" />
              {t("manageAll")}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {!pages?.length ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-12">
            <FileText className="mb-3 h-10 w-10 text-gray-400" />
            <h4 className="mb-1 text-sm font-medium text-gray-900">{t("noPages")}</h4>
            <p className="mb-4 text-xs text-gray-500">
              {t("noPagesDescription")}
            </p>
            <Link href={`/${locale}/dashboard/pages`}>
              <Button size="sm">
                <FileText className="me-2 h-4 w-4" />
                {t("createPage")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {pages.map((page) => (
              <Link
                key={page.id}
                href={`/${locale}/dashboard/pages/${page.id}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                    <Globe className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{page.title}</p>
                    <p className="text-xs text-gray-500">/{page.slug || "home"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={page.is_published ? "success" : "secondary"}>
                    {page.is_published ? tCommon("published") : tCommon("draft")}
                  </Badge>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
