"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Label, Textarea } from "@/shared/ui";
import { Toggle } from "@/shared/components/toggle";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import { useUpdateStore, useDeleteStore, useChangeSlug, useCheckSlug, useSetTheme } from "@/api/queries";
import { useQueryClient } from "@tanstack/react-query";
import { mediaApi } from "@/api/media";
import { usePages } from "@/api/pages";
import { useThemes, useTheme } from "@/api/themes";
import { TemplateBrowser } from "@/features/templates/template-browser";
import { StoreDomains } from "./store-domains";
import { ThemeColorEditor } from "@/features/themes/theme-color-editor";
import { ThemeBorderRadiusEditor } from "@/features/themes/theme-border-radius-editor";
import { ThemeAnimationsEditor } from "@/features/themes/theme-animations-editor";
import { ThemeDarkModeEditor } from "@/features/themes/theme-darkmode-editor";
import { ThemeTypographyEditor } from "@/features/themes/theme-typography-editor";
import { ThemeSpacingEditor } from "@/features/themes/theme-spacing-editor";
import type { Store, ThemeConfig } from "@/shared/types";

const BLOCKED_URL_PROTOCOLS = ["javascript:", "data:", "vbscript:"];
function validateUrl(url: string): boolean {
  const lower = url.toLowerCase().trim();
  for (const proto of BLOCKED_URL_PROTOCOLS) {
    if (lower.startsWith(proto)) return false;
  }
  return true;
}

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/..." },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
];

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs: TabId[] = ["general", "branding", "navigation", "template", "theme", "domains", "pages"];
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && validTabs.includes(tabParam as TabId) ? (tabParam as TabId) : "general"
  );

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

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
      <div className="border-b border-line">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-ink-soft hover:border-line hover:text-ink"
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
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slugTimerRef.current) {
      clearTimeout(slugTimerRef.current);
    }
    if (editingSlug && newSlug.length >= 3 && newSlug !== store.slug) {
      slugTimerRef.current = setTimeout(() => {
        checkSlug.mutate(newSlug, {
          onSuccess: (data) => setSlugAvailable(data.available),
          onError: () => setSlugAvailable(null),
        });
      }, 500);
    } else {
      setSlugAvailable(null);
    }
    return () => {
      if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    };
  }, [newSlug, editingSlug, store.slug, checkSlug]);

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
    : `http://${store.domain}`;

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
              <div className="rounded-lg border border-warning bg-warning-soft p-3 text-sm text-warning">
                <AlertTriangle className="me-1 inline h-4 w-4" />
                {"Changing your subdomain will break existing links and bookmarks. Old URLs will no longer work."}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newSlug}
                  onChange={(e) => {
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  className="flex-1 font-mono text-sm"
                />
                <span className="text-sm text-ink-soft">.{process.env.NEXT_PUBLIC_STORE_DOMAIN || "localhost"}</span>
              </div>
              {slugAvailable === true && (
                <p className="text-xs text-success">Slug is available</p>
              )}
              {slugAvailable === false && (
                <p className="text-xs text-error">Slug is already taken</p>
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
              <div className="flex-1 rounded-lg border border-line bg-rail px-4 py-2.5 font-mono text-sm text-ink">
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
              <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-primary-700">
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
            <div>
              <Input
                label={t("seoTitle")}
                placeholder={editLocale !== "en" ? `SEO title in ${editLocale === "ar" ? "Arabic" : editLocale}...` : t("seoTitlePlaceholder")}
                {...register("seo_title")}
              />
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-xs ${(watch("seo_title") || "").length > 60 ? "text-warning" : "text-ink-soft"}`}>
                  {(watch("seo_title") || "").length}/60 characters
                </span>
                {(watch("seo_title") || "").length > 60 && (
                  <span className="text-xs text-warning">May be truncated in search results</span>
                )}
              </div>
            </div>
            <div>
              <Input
                label={t("seoDescription")}
                placeholder={editLocale !== "en" ? `SEO description in ${editLocale === "ar" ? "Arabic" : editLocale}...` : t("seoDescriptionPlaceholder")}
                {...register("seo_description")}
              />
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-xs ${(watch("seo_description") || "").length > 160 ? "text-warning" : "text-ink-soft"}`}>
                  {(watch("seo_description") || "").length}/160 characters
                </span>
                {(watch("seo_description") || "").length > 160 && (
                  <span className="text-xs text-warning">May be truncated in search results</span>
                )}
              </div>
            </div>

            {/* Twitter Card Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{t("twitterCard") || "Twitter Card Type"}</label>
              <select
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
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
    <div className="rounded-lg border border-line bg-rail p-4">
      <p className="mb-2 text-xs font-medium text-ink-soft uppercase tracking-wide">{t("seoPreview") || "Search Engine Preview"}</p>
      <div className="space-y-1">
        <p className="text-[15px] font-medium text-primary-700 leading-snug truncate">{title || "Page Title"}</p>
        <p className="text-xs text-success truncate">{url}</p>
        <p className="text-xs text-ink-soft line-clamp-2">{description || "Page description will appear here in search results..."}</p>
      </div>
    </div>
  );
}

/* ── Branding Tab ─────────────────────────────────────────────────────── */

function BrandingTab({ store }: { store: Store }) {
  const t = useTranslations("storeSettings.branding");
  const tc = useTranslations("common");
  const updateStore = useUpdateStore();
  const queryClient = useQueryClient();
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    (store.settings as Record<string, unknown>)?.social_links as Record<string, string> || {}
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, field: "logo" | "favicon") => {
    const BLOCKED = [".php", ".exe", ".bat", ".sh", ".js", ".vbs", ".svg", ".svgz"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (BLOCKED.includes(ext)) {
      toast.error(`File type "${ext}" is not allowed`);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPG, and WebP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit");
      return;
    }

    try {
      const asset = await mediaApi.upload(file, undefined, file.name, `${field} for store`, store.id);
      await updateStore.mutateAsync({ id: store.id, [field]: asset.id });
      toast.success(tc("saved"));
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleOgImageUpload = async (file: File) => {
    const BLOCKED = [".php", ".exe", ".bat", ".sh", ".js", ".vbs", ".svg", ".svgz"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (BLOCKED.includes(ext)) {
      toast.error(`File type "${ext}" is not allowed`);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPG, and WebP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit");
      return;
    }

    try {
      const asset = await mediaApi.upload(file, undefined, file.name, "og_image for store", store.id);
      await updateStore.mutateAsync({ id: store.id, og_image: asset.id } as Partial<Store> & { id: string });
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
    const latestStore = queryClient.getQueryData<Store>(["stores", store.id]) || store;
    const latestSettings = (latestStore.settings || {}) as Record<string, unknown>;
    await updateStore.mutateAsync({
      id: store.id,
      settings: {
        ...latestSettings,
        social_links: socialLinks,
      },
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">{t("storeLogo") || "Store Logo"}</label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-line bg-rail overflow-hidden">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <Image className="h-8 w-8 text-ink-soft" />
                  )}
                </div>
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "logo");
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                    <Upload className="me-1 h-4 w-4" /> {t("uploadLogo") || "Upload Logo"}
                  </Button>
                  <p className="mt-1 text-xs text-ink-soft">PNG, JPG, WebP. Max 5MB.</p>
                </div>
              </div>
            </div>
            {/* Favicon */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">{t("favicon") || "Favicon"}</label>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed border-line bg-rail overflow-hidden">
                  {store.favicon_url ? (
                    <img src={store.favicon_url} alt="Favicon" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Image className="h-6 w-6 text-ink-soft" />
                  )}
                </div>
                <div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "favicon");
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()}>
                    <Upload className="me-1 h-4 w-4" /> {t("uploadFavicon") || "Upload"}
                  </Button>
                  <p className="mt-1 text-xs text-ink-soft">32x32 or 64x64. Max 5MB.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OG Image */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ogImage") || "Social Share Image"}</CardTitle>
          <CardDescription>{t("ogImageDescription") || "Image shown when your store link is shared on social media (1200x630 recommended)"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-32 w-64 items-center justify-center rounded-lg border-2 border-dashed border-line bg-rail overflow-hidden">
              {store.og_image_url ? (
                <img src={store.og_image_url} alt="OG Image" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <Image className="mx-auto h-8 w-8 text-ink-soft" />
                  <p className="mt-1 text-xs text-ink-soft">1200 x 630</p>
                </div>
              )}
            </div>
            <div>
              <input
                ref={ogImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleOgImageUpload(file);
                }}
              />
              <Button variant="outline" size="sm" onClick={() => ogImageInputRef.current?.click()}>
                <Upload className="me-1 h-4 w-4" /> {t("uploadOgImage") || "Upload Image"}
              </Button>
              <p className="mt-1 text-xs text-ink-soft">PNG, JPG, WebP. Max 5MB.</p>
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
              <span className="w-24 text-sm font-medium text-ink-soft">{label}</span>
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
                  className="rounded-lg p-2 text-ink-soft hover:bg-error-soft hover:text-error"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Announcement Bar */}
      <AnnouncementBarSettings store={store} />
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
  header_layout?: "classic" | "centered";
  header_sticky?: boolean;
  header_show_search?: boolean;
  header_show_cart?: boolean;
  header_height?: number;
  logo_height?: number;
}

interface FooterColumn {
  title: string | Record<string, string>;
  links: { label: string | Record<string, string>; url: string }[];
}

interface FooterData {
  columns?: FooterColumn[];
  copyright?: string | Record<string, string>;
  social_links?: Record<string, string>;
  layout?: "columns" | "stacked" | "minimal";
  show_social?: boolean;
  show_copyright?: boolean;
}

function NavigationTab({ store }: { store: Store }) {
  const tc = useTranslations("common");
  const updateStore = useUpdateStore();
  const [editLocale, setEditLocale] = useState("en");

  const nav: NavigationData = store.navigation || {};
  const footer: FooterData = store.footer_config || {};

  const [navData, setNavData] = useState<NavigationData>({
    logo_text: nav.logo_text || "",
    links: nav.links || [],
    cta_button: nav.cta_button || { label: "", url: "", enabled: false },
    header_layout: nav.header_layout || "classic",
    header_sticky: nav.header_sticky !== false,
    header_show_search: nav.header_show_search !== false,
    header_show_cart: nav.header_show_cart !== false,
    header_height: nav.header_height,
    logo_height: nav.logo_height,
  });

  const [footerData, setFooterData] = useState<FooterData>({
    columns: footer.columns || [],
    copyright: footer.copyright || "",
    layout: footer.layout || "columns",
    show_social: footer.show_social !== false,
    show_copyright: footer.show_copyright !== false,
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
        header_layout: navData.header_layout || "classic",
        header_sticky: navData.header_sticky !== false,
        header_show_search: navData.header_show_search !== false,
        header_show_cart: navData.header_show_cart !== false,
        header_height: navData.header_height || undefined,
        logo_height: navData.logo_height || undefined,
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
    for (const [, url] of Object.entries(footerData.social_links || {})) {
      if (url && !validateUrl(url)) {
        toast.error("URLs containing javascript:, data:, or vbscript: are not allowed");
        return;
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
        layout: footerData.layout || "columns",
        show_social: footerData.show_social !== false,
        show_copyright: footerData.show_copyright !== false,
        social_links: footerData.social_links || {},
      } as Store["footer_config"],
    });
    toast.success(tc("saved"));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink">Navigation & Footer</h3>
        <LocaleToggle value={editLocale} onChange={setEditLocale} />
      </div>

      {editLocale !== "en" && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-primary-700">
          Editing {editLocale === "ar" ? "Arabic" : editLocale} labels. English values are used as fallback.
        </div>
      )}

      {/* Header Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Header Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Header Style</label>
            <select
              value={navData.header_layout || "classic"}
              onChange={(e) =>
                setNavData((prev) => ({ ...prev, header_layout: e.target.value as "classic" | "centered" }))
              }
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="classic">Classic — logo left, links centered</option>
              <option value="centered">Centered — logo centered, links below</option>
            </select>
          </div>
          <Toggle
            label="Sticky header (stays at top while scrolling)"
            enabled={navData.header_sticky !== false}
            onToggle={() => setNavData((prev) => ({ ...prev, header_sticky: prev.header_sticky === false }))}
          />
          <Toggle
            label="Show search"
            enabled={navData.header_show_search !== false}
            onToggle={() => setNavData((prev) => ({ ...prev, header_show_search: prev.header_show_search === false }))}
          />
          <Toggle
            label="Show cart icon"
            enabled={navData.header_show_cart !== false}
            onToggle={() => setNavData((prev) => ({ ...prev, header_show_cart: prev.header_show_cart === false }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Header Height (px)</label>
              <Input
                type="number"
                min={48}
                max={120}
                value={navData.header_height ?? ""}
                placeholder="64"
                onChange={(e) =>
                  setNavData((prev) => ({ ...prev, header_height: e.target.value === "" ? undefined : Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Logo Height (px)</label>
              <Input
                type="number"
                min={16}
                max={80}
                value={navData.logo_height ?? ""}
                placeholder="32"
                onChange={(e) =>
                  setNavData((prev) => ({ ...prev, logo_height: e.target.value === "" ? undefined : Number(e.target.value) }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
            <span className="text-sm font-medium text-ink">Links</span>
            <Button variant="outline" size="sm" onClick={addNavLink}>
              <Plus className="me-1 h-4 w-4" /> Add Link
            </Button>
          </div>
          {navData.links?.map((link, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <GripVertical className="h-4 w-4 text-ink-soft hidden sm:block" />
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
                className="rounded-lg p-2 text-ink-soft hover:bg-error-soft hover:text-error sm:ml-auto"
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
            <div className="flex flex-col sm:flex-row gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Footer Layout</label>
              <select
                value={footerData.layout || "columns"}
                onChange={(e) =>
                  setFooterData((prev) => ({ ...prev, layout: e.target.value as FooterData["layout"] }))
                }
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              >
                <option value="columns">Columns — link columns with socials &amp; copyright</option>
                <option value="stacked">Stacked — centered brand on top</option>
                <option value="minimal">Minimal — socials and copyright only</option>
              </select>
            </div>
          </div>
          <Toggle
            label="Show social icons"
            enabled={footerData.show_social !== false}
            onToggle={() => setFooterData((prev) => ({ ...prev, show_social: prev.show_social === false }))}
          />
          <Toggle
            label="Show copyright text"
            enabled={footerData.show_copyright !== false}
            onToggle={() => setFooterData((prev) => ({ ...prev, show_copyright: prev.show_copyright === false }))}
          />
          {footerData.columns?.map((col, colIndex) => (
            <div key={colIndex} className="rounded-lg border border-line p-4">
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
                  className="rounded-lg p-2 text-ink-soft hover:bg-error-soft hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {col.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                      className="rounded-lg p-2 text-ink-soft hover:bg-error-soft hover:text-error sm:ml-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* Footer Social Links */}
          <div className="pt-2">
            <label className="mb-1 block text-sm font-medium text-ink">Footer Social Links</label>
            <p className="mb-2 text-xs text-ink-soft">
              Overrides your store-level social links in the footer. Leave empty to reuse them.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
                <Input
                  key={key}
                  placeholder={label}
                  aria-label={`Footer ${label} URL`}
                  value={footerData.social_links?.[key] || ""}
                  onChange={(e) =>
                    setFooterData((prev) => ({
                      ...prev,
                      social_links: { ...(prev.social_links || {}), [key]: e.target.value },
                    }))
                  }
                />
              ))}
            </div>
          </div>
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
            <p className="text-sm text-ink-soft">
              {t("description")}
            </p>
          </CardContent>
        </Card>
      )}
      <TemplateBrowser storeId={store.id} />
    </div>
  );
}

/* ── Announcement Bar Settings ──────────────────────────────────────── */

function AnnouncementBarSettings({ store }: { store: Store }) {
  const t = useTranslations("storeSettings.branding");
  const tc = useTranslations("common");
  const updateStore = useUpdateStore();
  const queryClient = useQueryClient();
  const [editLocale, setEditLocale] = useState("en");
  const settings = (store.settings || {}) as Record<string, unknown>;
  const ab = (settings.announcement_bar || {}) as {
    enabled?: boolean;
    text?: string | Record<string, string>;
    link_url?: string;
    link_label?: string | Record<string, string>;
    background_color?: string;
    text_color?: string;
    dismissible?: boolean;
  };

  const [enabled, setEnabled] = useState(ab.enabled || false);
  const [text, setText] = useState<string | Record<string, string>>(ab.text || "");
  const [linkUrl, setLinkUrl] = useState(ab.link_url || "");
  const [linkLabel, setLinkLabel] = useState<string | Record<string, string>>(ab.link_label || "");
  const [bgColor, setBgColor] = useState(ab.background_color || "#1a1a2e");
  const [textColor, setTextColor] = useState(ab.text_color || "#ffffff");
  const [dismissible, setDismissible] = useState(ab.dismissible !== false);

  const localizedValue = (value?: string | Record<string, string>): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[editLocale] || value.en || "";
  };

  const setLocalizedValue = (
    value: string,
    current: string | Record<string, string> | undefined
  ): string | Record<string, string> => {
    if (editLocale === "en") return value;
    const nested: Record<string, string> =
      typeof current === "string" ? { en: current } : { ...(current || {}) };
    nested[editLocale] = value;
    return nested;
  };

  const handleSave = async () => {
    const latestStore = queryClient.getQueryData<Store>(["stores", store.id]) || store;
    const latestSettings = (latestStore.settings || {}) as Record<string, unknown>;
    await updateStore.mutateAsync({
      id: store.id,
      settings: {
        ...latestSettings,
        announcement_bar: { enabled, text, link_url: linkUrl, link_label: linkLabel, background_color: bgColor, text_color: textColor, dismissible },
      },
    });
    toast.success(tc("saved"));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("announcementBar") || "Announcement Bar"}</CardTitle>
            <CardDescription>{t("announcementBarDescription") || "Show a promotional banner above your store header"}</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <LocaleToggle value={editLocale} onChange={setEditLocale} />
            <Button onClick={handleSave} isLoading={updateStore.isPending}>
              {tc("save")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Toggle label={t("enableAnnouncement") || "Enable Announcement Bar"} enabled={enabled} onToggle={() => setEnabled(!enabled)} />
        {enabled && (
          <>
            {editLocale !== "en" && (
              <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-primary-700">
                Editing {editLocale === "ar" ? "Arabic" : editLocale} announcement text. English values are used as fallback.
              </div>
            )}
            <div>
              <Label className="text-sm">{t("announcementText") || "Message Text"}</Label>
              <Input
                value={localizedValue(text)}
                onChange={(e) => setText((prev) => setLocalizedValue(e.target.value, prev))}
                placeholder="Free shipping on orders over $50!"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">{t("announcementLink") || "Link URL"}</Label>
                <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/shop/sale" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">{t("announcementLinkLabel") || "Button Label"}</Label>
                <Input
                  value={localizedValue(linkLabel)}
                  onChange={(e) => setLinkLabel((prev) => setLocalizedValue(e.target.value, prev))}
                  placeholder="Shop Now"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border" />
                <Label className="text-sm">{t("announcementBgColor") || "Background Color"}</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border" />
                <Label className="text-sm">{t("announcementTextColor") || "Text Color"}</Label>
              </div>
            </div>
            <Toggle label={t("announcementDismissible") || "Dismissible"} enabled={dismissible} onToggle={() => setDismissible(!dismissible)} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Theme Tab ───────────────────────────────────────────────────────── */

/** Deep-merge a partial config (e.g. a theme preset) over the current one. */
function mergeThemeConfig(base: ThemeConfig, patch: Partial<ThemeConfig>): ThemeConfig {
  const merged: ThemeConfig = { ...base };
  if (patch.colors) merged.colors = { ...base.colors, ...patch.colors };
  if (patch.typography) merged.typography = { ...base.typography, ...patch.typography };
  if (patch.spacing) merged.spacing = { ...base.spacing, ...patch.spacing };
  if (patch.borderRadius) merged.borderRadius = { ...base.borderRadius, ...patch.borderRadius };
  if (patch.animations) merged.animations = { ...base.animations, ...patch.animations };
  if (patch.darkMode) merged.darkMode = { ...base.darkMode, ...patch.darkMode };
  return merged;
}

function ThemeTab({ store }: { store: Store }) {
  const t = useTranslations("storeSettings.theme");
  const tc = useTranslations("common");
  const updateStore = useUpdateStore();
  const setTheme = useSetTheme();
  const queryClient = useQueryClient();
  const { data: allThemes } = useThemes();

  const themeId = store.theme;
  const { data: activeTheme, isLoading: themeLoading } = useTheme(themeId || "");

  const baseConfig = activeTheme?.config || ({} as ThemeConfig);
  const override = (store.theme_config_override as Partial<ThemeConfig>) || {};
  const [editedOverride, setEditedOverride] = useState<Partial<ThemeConfig> | null>(null);
  const localConfig = mergeThemeConfig(baseConfig, editedOverride ? mergeThemeConfig(override as ThemeConfig, editedOverride) : (override as ThemeConfig));
  const presets = activeTheme?.presets || [];
  const [customCss, setCustomCss] = useState(
    (((store.settings || {}) as Record<string, unknown>).custom_css as string) || ""
  );

  const handleSaveTheme = async () => {
    const merged = (editedOverride || {}) as Partial<ThemeConfig>;
    await updateStore.mutateAsync({ id: store.id, theme_config_override: mergeThemeConfig(override as ThemeConfig, merged) as unknown as Record<string, unknown> });
    setEditedOverride(null);
    toast.success(tc("saved"));
  };

  const applyPreset = (config: Partial<ThemeConfig>) => {
    setEditedOverride(mergeThemeConfig(localConfig, config) as unknown as Partial<ThemeConfig>);
  };

  const handleSaveCustomCss = async () => {
    const latestStore = queryClient.getQueryData<Store>(["stores", store.id]) || store;
    const latestSettings = (latestStore.settings || {}) as Record<string, unknown>;
    await updateStore.mutateAsync({
      id: store.id,
      settings: { ...latestSettings, custom_css: customCss || "" },
    });
    toast.success(tc("saved"));
  };

  const handleSwitchTheme = async (newThemeId: string) => {
    if (!newThemeId || newThemeId === themeId) return;
    await setTheme.mutateAsync({ storeId: store.id, themeId: newThemeId });
    setEditedOverride(null);
    toast.success(t("themeApplied") || "Theme applied");
  };

  const installedThemes = allThemes?.filter((th) => !th.is_system || th.organization) || [];

  if (themeLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-ink-soft">
          {tc("loading")}...
        </CardContent>
      </Card>
    );
  }

  if (!themeId || !activeTheme) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Palette className="mx-auto mb-3 h-10 w-10 text-ink-soft" />
          <h4 className="mb-1 text-sm font-medium text-ink">{t("noTheme") || "No Theme Assigned"}</h4>
          <p className="mb-4 text-xs text-ink-soft">{t("noThemeDescription") || "Install a theme from the marketplace to get started"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme Switcher */}
      <Card>
        <CardHeader>
          <CardTitle>{t("activeTheme") || "Active Theme"}</CardTitle>
          <CardDescription>{activeTheme.name} v{activeTheme.version}</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={themeId || ""}
            onChange={(e) => handleSwitchTheme(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
          >
            {installedThemes.map((th) => (
              <option key={th.id} value={th.id}>
                {th.name} {th.id === themeId ? "(active)" : ""}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Style Presets */}
      {presets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("stylePresets") || "Style Presets"}</CardTitle>
            <CardDescription>{t("stylePresetsDescription") || "One-click color variations of this theme. Applied values stay fully editable below."}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {presets.map((preset) => {
                const colors = (preset.config as { colors?: Record<string, string> })?.colors || {};
                const swatches = ["primary", "secondary", "accent", "background"].filter((k) => colors[k]);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.config)}
                    className="rounded-lg border border-line p-3 text-start transition hover:border-primary-400 hover:shadow-sm"
                  >
                    <div className="mb-2 flex gap-1">
                      {swatches.map((k) => (
                        <span key={k} className="h-5 w-5 rounded-full border border-black/10" style={{ background: colors[k] }} />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-ink">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>{t("colors") || "Colors"}</CardTitle>
          <CardDescription>{t("colorsDescription") || "Customize your store's color palette"}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeColorEditor
            colors={localConfig.colors}
            onChange={(colors) => setEditedOverride({ ...localConfig, colors }) as unknown as Partial<ThemeConfig>}
          />
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>{t("typography") || "Typography"}</CardTitle>
          <CardDescription>{t("typographyDescription") || "Fonts, sizes, weights and letter spacing"}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeTypographyEditor
            typography={localConfig.typography || ({} as ThemeConfig["typography"])}
            onChange={(typography) => setEditedOverride({ ...localConfig, typography }) as unknown as Partial<ThemeConfig>}
          />
        </CardContent>
      </Card>

      {/* Spacing */}
      <Card>
        <CardHeader>
          <CardTitle>{t("spacing") || "Spacing & Layout"}</CardTitle>
          <CardDescription>{t("spacingDescription") || "Section padding, container width and grid gaps"}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSpacingEditor
            spacing={localConfig.spacing || ({} as ThemeConfig["spacing"])}
            onChange={(spacing) => setEditedOverride({ ...localConfig, spacing }) as unknown as Partial<ThemeConfig>}
          />
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>{t("borderRadius") || "Border Radius"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeBorderRadiusEditor
            borderRadius={localConfig.borderRadius}
            onChange={(borderRadius) => setEditedOverride({ ...localConfig, borderRadius }) as unknown as Partial<ThemeConfig>}
          />
        </CardContent>
      </Card>

      {/* Animations & Dark Mode */}
      <Card>
        <CardHeader>
          <CardTitle>{t("behavior") || "Behavior"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ThemeAnimationsEditor
            animations={localConfig.animations}
            onChange={(animations) => setEditedOverride({ ...localConfig, animations }) as unknown as Partial<ThemeConfig>}
          />
          <ThemeDarkModeEditor
            darkMode={localConfig.darkMode}
            onChange={(darkMode) => setEditedOverride({ ...localConfig, darkMode }) as unknown as Partial<ThemeConfig>}
          />
        </CardContent>
      </Card>

      {/* Custom CSS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("customCss") || "Custom CSS"}</CardTitle>
              <CardDescription>{t("customCssDescription") || "Advanced styling applied to your entire storefront. Theme variables like --color-primary are available."}</CardDescription>
            </div>
            <Button onClick={handleSaveCustomCss} isLoading={updateStore.isPending}>
              {tc("save")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            rows={10}
            maxLength={20000}
            spellCheck={false}
            placeholder={"/* Example */\n.storefront header {\n  border-bottom: 2px solid var(--color-primary);\n}"}
            className="w-full rounded-lg border border-line bg-[#241E15] p-3 font-mono text-xs text-[#F5EDDC] focus:border-primary-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-ink-soft">{customCss.length}/20000</p>
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
              <div key={i} className="h-16 shimmer rounded-lg" />
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
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line py-12">
            <FileText className="mb-3 h-10 w-10 text-ink-soft" />
            <h4 className="mb-1 text-sm font-medium text-ink">{t("noPages")}</h4>
            <p className="mb-4 text-xs text-ink-soft">
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
          <div className="divide-y divide-line rounded-lg border border-line">
            {pages.map((page) => (
              <Link
                key={page.id}
                href={`/${locale}/dashboard/pages/${page.id}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-rail"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                    <Globe className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{page.title}</p>
                    <p className="text-xs text-ink-soft">/{page.slug || "home"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={page.is_published ? "success" : "secondary"}>
                    {page.is_published ? tCommon("published") : tCommon("draft")}
                  </Badge>
                  <ExternalLink className="h-4 w-4 text-ink-soft" />
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
    <Card className="border-error">
      <CardHeader>
        <CardTitle className="text-error">{t("title") || "Danger Zone"}</CardTitle>
        <CardDescription>{t("description") || "Permanently delete this store and all its data. This action cannot be undone."}</CardDescription>
      </CardHeader>
      <CardContent>
        {!showConfirm ? (
          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            <Trash2 className="me-1 h-4 w-4" /> {t("deleteStore") || "Delete Store"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-error bg-error-soft p-3 text-sm text-error">
              <AlertTriangle className="mb-1 inline h-4 w-4" /> {t("deleteWarning") || "This will permanently delete all products, orders, customers, pages, and settings."}
            </div>
            <p className="text-sm text-ink-soft">
              {t("confirmSlugHint") || "Type"} <span className="font-mono font-bold">{store.slug}</span> {t("confirmSlugHintEnd") || "to confirm:"}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
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


