"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/shared/ui";
import { Toggle } from "@/shared/components/toggle";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import { useUpdateStore, useDeleteStore, useChangeSlug, useCheckSlug } from "@/api/queries";
import { usePages } from "@/api/pages";
import { TemplateBrowser } from "@/features/templates/template-browser";
import { StoreDomains } from "./store-domains";
import type { Store, ThemeConfig } from "@/shared/types";

const BLOCKED_URL_PROTOCOLS = ["javascript:", "data:", "vbscript:"];
function validateUrl(url: string): boolean {
  const lower = url.toLowerCase().trim();
  for (const proto of BLOCKED_URL_PROTOCOLS) {
    if (lower.startsWith(proto)) return false;
  }
  return true;
}

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
  Image,
  LinkIcon,
  Upload,
  Copy,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  og_image: z.string().optional(),
  twitter_card: z.enum(["summary", "summary_large_image"]).optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

type TabId = "general" | "branding" | "navigation" | "template" | "theme" | "domains" | "pages";

interface StoreSettingsFormProps {
  store: Store;
}

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const t = useTranslations("storeSettings");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const TABS: { id: TabId; label: string; icon: typeof Settings }[] = [
    { id: "general", label: t("tabs.general"), icon: Settings },
    { id: "branding", label: t("tabs.branding") || "Branding", icon: Image },
    { id: "navigation", label: t("tabs.navigation") || "Navigation", icon: Navigation },
    { id: "template", label: t("tabs.template"), icon: LayoutTemplate },
    { id: "theme", label: t("tabs.theme"), icon: Palette },
    { id: "domains", label: t("tabs.domains") || "Domains", icon: Globe },
    { id: "pages", label: t("tabs.pages"), icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
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
      {activeTab === "branding" && <BrandingTab store={store} />}
      {activeTab === "navigation" && <NavigationTab store={store} />}
      {activeTab === "template" && <TemplateTab store={store} />}
      {activeTab === "theme" && <ThemeTab store={store} />}
      {activeTab === "domains" && <DomainsTab store={store} />}
      {activeTab === "pages" && <PagesTab store={store} locale={locale} />}

      <DangerZone store={store} />
    </div>
  );
}

/* ── General Tab ─────────────────────────────────────────────────────── */

function GeneralTab({ store }: { store: Store }) {
  const t = useTranslations("storeSettings.general");
  const tc = useTranslations("common");
  const updateStore = useUpdateStore();
  const changeSlug = useChangeSlug();
  const checkSlug = useCheckSlug();
  const [editLocale, setEditLocale] = useState("en");
  const [copied, setCopied] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState(store.slug);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

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
    toast.success(tc("saved"));
  };

  const storeUrl = store.custom_domain
    ? `https://${store.custom_domain}`
    : `https://${store.slug}.tujjar.com`;

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const descriptionPlaceholder = editLocale === "en"
    ? t("descriptionPlaceholder")
    : `Enter ${editLocale === "ar" ? "Arabic" : editLocale} description...`;

  return (
    <div className="space-y-6">
      {/* Store URL */}
      <Card>
        <CardHeader>
          <CardTitle>{t("storeUrl") || "Store URL"}</CardTitle>
          <CardDescription>{t("storeUrlDescription") || "Your store's public address"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingSlug ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={newSlug}
                  onChange={(e) => {
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    if (e.target.value.length >= 3) {
                      const timer = setTimeout(() => {
                        checkSlug.mutate(e.target.value, {
                          onSuccess: (data) => setSlugAvailable(data.available),
                          onError: () => setSlugAvailable(null),
                        });
                      }, 500);
                      return () => clearTimeout(timer);
                    }
                    setSlugAvailable(null);
                  }}
                  className="flex-1 font-mono text-sm"
                />
                <span className="text-sm text-gray-500">.tujjar.com</span>
              </div>
              {slugAvailable === true && (
                <p className="text-xs text-green-600">Slug is available</p>
              )}
              {slugAvailable === false && (
                <p className="text-xs text-red-600">Slug is already taken</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (slugAvailable !== true) return;
                    await changeSlug.mutateAsync({ id: store.id, slug: newSlug });
                    setEditingSlug(false);
                    toast.success(t("slugChanged") || "Subdomain updated");
                  }}
                  disabled={slugAvailable !== true}
                  isLoading={changeSlug.isPending}
                >
                  {tc("save")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingSlug(false); setNewSlug(store.slug); }}>
                  {tc("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm text-gray-700">
                {storeUrl}
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditingSlug(true)}>
                {t("changeSubdomain") || "Change"}
              </Button>
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Details */}
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

            {/* Twitter Card Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("twitterCard") || "Twitter Card Type"}</label>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                {...register("twitter_card")}
              >
                <option value="summary_large_image">Summary Large Image</option>
                <option value="summary">Summary</option>
              </select>
            </div>

            {/* SEO Preview */}
            <SeoPreview
              title={watch("seo_title") || watch("name") || store.name}
              description={watch("seo_description") || store.description}
              url={storeUrl}
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
                {t("saveChanges")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

/* ── SEO Preview ─────────────────────────────────────────────────────── */

function SeoPreview({ title, description, url }: { title: string; description: string; url: string }) {
  const t = useTranslations("storeSettings.general");

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{t("seoPreview") || "Search Engine Preview"}</p>
      <div className="space-y-1">
        <p className="text-[15px] font-medium text-blue-700 leading-snug truncate">{title || "Page Title"}</p>
        <p className="text-xs text-green-700 truncate">{url}</p>
        <p className="text-xs text-gray-500 line-clamp-2">{description || "Page description will appear here in search results..."}</p>
      </div>
    </div>
  );
}

/* ── Branding Tab ─────────────────────────────────────────────────────── */

function BrandingTab({ store }: { store: Store }) {
  const t = useTranslations("storeSettings.branding");
  const tc = useTranslations("common");
  const updateStore = useUpdateStore();
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    store.footer_config?.social_links || {}
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const SOCIAL_PLATFORMS = [
    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
    { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/..." },
    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
    { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/..." },
    { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
  ];

  const handleFileUpload = async (file: File, field: "logo" | "favicon") => {
    const BLOCKED = [".php", ".exe", ".bat", ".sh", ".js", ".vbs", ".svg", ".svgz"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (BLOCKED.includes(ext)) {
      toast.error(`File type "${ext}" is not allowed`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    try {
      const { apiClient } = await import("@/api/client");
      const { data } = await apiClient.post("/media/upload/", formData);
      await updateStore.mutateAsync({ id: store.id, [field]: data.url || data.file });
      toast.success(tc("saved"));
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleSaveSocialLinks = async () => {
    for (const [, url] of Object.entries(socialLinks)) {
      if (url && !validateUrl(url)) {
        toast.error("URLs containing javascript:, data:, or vbscript: are not allowed");
        return;
      }
    }
    await updateStore.mutateAsync({
      id: store.id,
      footer_config: {
        ...(store.footer_config || {}),
        social_links: socialLinks,
      } as Store["footer_config"],
    });
    toast.success(tc("saved"));
  };

  return (
    <div className="space-y-6">
      {/* Logo & Favicon */}
      <Card>
        <CardHeader>
          <CardTitle>{t("logoAndFavicon") || "Logo & Favicon"}</CardTitle>
          <CardDescription>{t("logoDescription") || "Upload your store logo and favicon"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{t("storeLogo") || "Store Logo"}</label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
                  {store.logo ? (
                    <img src={store.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <Image className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "logo");
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                    <Upload className="me-1 h-4 w-4" /> {t("uploadLogo") || "Upload Logo"}
                  </Button>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, WebP. Max 5MB.</p>
                </div>
              </div>
            </div>
            {/* Favicon */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{t("favicon") || "Favicon"}</label>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
                  {store.favicon ? (
                    <img src={store.favicon} alt="Favicon" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Image className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "favicon");
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()}>
                    <Upload className="me-1 h-4 w-4" /> {t("uploadFavicon") || "Upload"}
                  </Button>
                  <p className="mt-1 text-xs text-gray-500">32x32 or 64x64. Max 5MB.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("socialLinks") || "Social Links"}</CardTitle>
              <CardDescription>{t("socialLinksDescription") || "Add links to your social media profiles"}</CardDescription>
            </div>
            <Button onClick={handleSaveSocialLinks} isLoading={updateStore.isPending}>
              {tc("save")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-24 text-sm font-medium text-gray-600">{label}</span>
              <Input
                placeholder={placeholder}
                value={socialLinks[key] || ""}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                className="flex-1"
              />
              {socialLinks[key] && (
                <button
                  type="button"
                  onClick={() => setSocialLinks((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  })}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
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
  const tc = useTranslations("common");
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
    const allLinks = [...(navData.links || []), ...(navData.cta_button?.url ? [{ url: navData.cta_button.url }] : [])];
    for (const link of allLinks) {
      if (link.url && !validateUrl(link.url)) {
        toast.error("URLs containing javascript:, data:, or vbscript: are not allowed");
        return;
      }
    }
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
    toast.success(tc("saved"));
  };

  const handleSaveFooter = async () => {
    for (const col of footerData.columns || []) {
      for (const link of col.links || []) {
        if (link.url && !validateUrl(link.url)) {
          toast.error("URLs containing javascript:, data:, or vbscript: are not allowed");
          return;
        }
      }
    }
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
    toast.success(tc("saved"));
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
  const tc = useTranslations("common");
  const updateStore = useUpdateStore();

  const theme = (store.theme as unknown as { config?: ThemeConfig })?.config || {} as ThemeConfig;
  const colors = theme.colors || ({} as ThemeConfig["colors"]);
  const borderRadius = theme.borderRadius || ({} as ThemeConfig["borderRadius"]);
  const animations = theme.animations || { enabled: true, duration: "0.3s", easing: "ease" };
  const darkMode = theme.darkMode || { enabled: false, default: false, toggle: true };

  const [themeColors, setThemeColors] = useState(colors);
  const [themeRadius, setThemeRadius] = useState(borderRadius);
  const [themeAnimations, setThemeAnimations] = useState(animations);
  const [themeDarkMode, setThemeDarkMode] = useState(darkMode);

  const COLOR_FIELDS = [
    { key: "primary" as const, label: "Primary" },
    { key: "secondary" as const, label: "Secondary" },
    { key: "accent" as const, label: "Accent" },
    { key: "background" as const, label: "Background" },
    { key: "surface" as const, label: "Surface" },
    { key: "text" as const, label: "Text" },
    { key: "textSecondary" as const, label: "Text Secondary" },
    { key: "border" as const, label: "Border" },
    { key: "error" as const, label: "Error" },
    { key: "success" as const, label: "Success" },
    { key: "warning" as const, label: "Warning" },
  ];

  const handleSaveTheme = async () => {
    await updateStore.mutateAsync({
      id: store.id,
      settings: {
        ...((store.settings || {}) as Record<string, unknown>),
        theme: {
          colors: themeColors,
          borderRadius: themeRadius,
          animations: themeAnimations,
          darkMode: themeDarkMode,
        },
      },
    });
    toast.success(tc("saved"));
  };

  return (
    <div className="space-y-6">
      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>{t("colors") || "Colors"}</CardTitle>
          <CardDescription>{t("colorsDescription") || "Customize your store's color palette"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColors[key] || "#000000"}
                  onChange={(e) => setThemeColors((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="h-8 w-8 cursor-pointer rounded border border-gray-200"
                />
                <div>
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400 font-mono">{themeColors[key] || "#000000"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>{t("borderRadius") || "Border Radius"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(["small", "medium", "large", "full"] as const).map((key) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-gray-700 capitalize">{key}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={themeRadius[key] || 0}
                    onChange={(e) => setThemeRadius((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="w-8 text-right text-xs text-gray-500">{themeRadius[key] || 0}px</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Animations & Dark Mode */}
      <Card>
        <CardHeader>
          <CardTitle>{t("behavior") || "Behavior"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label={t("enableAnimations") || "Enable Animations"}
            enabled={themeAnimations.enabled}
            onToggle={() => setThemeAnimations((prev) => ({ ...prev, enabled: !prev.enabled }))}
          />
          <Toggle
            label={t("enableDarkMode") || "Enable Dark Mode Toggle"}
            enabled={themeDarkMode.enabled}
            onToggle={() => setThemeDarkMode((prev) => ({ ...prev, enabled: !prev.enabled }))}
          />
          {themeDarkMode.enabled && (
            <Toggle
              label={t("darkModeDefault") || "Default to Dark Mode"}
              enabled={themeDarkMode.default}
              onToggle={() => setThemeDarkMode((prev) => ({ ...prev, default: !prev.default }))}
            />
          )}
          {themeDarkMode.enabled && (
            <Toggle
              label={t("showDarkModeToggle") || "Show Dark Mode Toggle in Header"}
              enabled={themeDarkMode.toggle}
              onToggle={() => setThemeDarkMode((prev) => ({ ...prev, toggle: !prev.toggle }))}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveTheme} isLoading={updateStore.isPending}>
          {tc("save")}
        </Button>
      </div>
    </div>
  );
}

/* ── Domains Tab ─────────────────────────────────────────────────────── */

function DomainsTab({ store }: { store: Store }) {
  return <StoreDomains storeId={store.id} />;
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

/* ── Danger Zone ─────────────────────────────────────────────────────── */

function DangerZone({ store }: { store: Store }) {
  const t = useTranslations("storeSettings.dangerZone");
  const tc = useTranslations("common");
  const router = useRouter();
  const deleteStore = useDeleteStore();
  const [confirmSlug, setConfirmSlug] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (confirmSlug !== store.slug) return;
    try {
      await deleteStore.mutateAsync(store.id);
      toast.success(t("storeDeleted") || "Store deleted");
      router.push("/");
    } catch {
      toast.error(t("deleteFailed") || "Failed to delete store");
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">{t("title") || "Danger Zone"}</CardTitle>
        <CardDescription>{t("description") || "Permanently delete this store and all its data. This action cannot be undone."}</CardDescription>
      </CardHeader>
      <CardContent>
        {!showConfirm ? (
          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            <Trash2 className="me-1 h-4 w-4" /> {t("deleteStore") || "Delete Store"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mb-1 inline h-4 w-4" /> {t("deleteWarning") || "This will permanently delete all products, orders, customers, pages, and settings."}
            </div>
            <p className="text-sm text-gray-600">
              {t("confirmSlugHint") || "Type"} <span className="font-mono font-bold">{store.slug}</span> {t("confirmSlugHintEnd") || "to confirm:"}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder={store.slug}
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmSlug !== store.slug}
                isLoading={deleteStore.isPending}
              >
                {t("confirmDelete") || "Yes, Delete Store"}
              </Button>
              <Button variant="outline" onClick={() => { setShowConfirm(false); setConfirmSlug(""); }}>
                {tc("cancel")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
