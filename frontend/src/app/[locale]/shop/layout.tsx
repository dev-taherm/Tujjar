"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingCart, User, Search, Facebook, Twitter, Instagram, Youtube, Linkedin, Sun, Moon } from "lucide-react";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { generateColorShades } from "@/lib/color-palette";
import { AnnouncementBar } from "@/features/store/announcement-bar";

interface NavLink {
  label: string;
  url: string;
  order?: number;
}

interface Navigation {
  logo_text?: string;
  links?: NavLink[];
  cta_button?: { label: string; url: string; enabled: boolean };
}

interface FooterColumn {
  title: string;
  links: { label: string; url: string }[];
}

interface FooterConfig {
  columns?: FooterColumn[];
  copyright?: string;
  social_links?: Record<string, string>;
}

interface ThemeConfig {
  colors?: Record<string, string>;
  borderRadius?: Record<string, number>;
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    baseFontSize?: number;
    scale?: number;
    lineHeight?: number;
  };
  spacing?: {
    sectionPaddingY?: number;
    sectionPaddingX?: number;
    containerMaxWidth?: number;
    gridGap?: number;
  };
  animations?: { enabled: boolean; duration: string; easing: string };
  darkMode?: { enabled: boolean; default: boolean; toggle: boolean };
}

interface StorefrontStore {
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  favicon_url: string | null;
  navigation: Navigation;
  footer_config: FooterConfig;
  seo_title: string;
  seo_description: string;
  og_image: string | null;
  twitter_card: string;
  domain: string;
  theme_config: ThemeConfig | null;
  settings: Record<string, unknown>;
}

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pathSlug = pathname.split("/")[3] || "";
  const locale = useLocale();
  const tNav = useTranslations("storefront.header");

  const subdomainSlug = useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof window === "undefined") return "";
      const hostname = window.location.hostname;
      const parts = hostname.split(".");
      if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
        return parts[0];
      }
      return "";
    },
    () => ""
  );

  const slug = subdomainSlug || pathSlug;

  const { data } = useQuery<{ store: StorefrontStore }>({
    queryKey: ["storefront", slug, locale],
    queryFn: async () => {
      if (!slug) return null;
      const res = await fetch(`/api/v1/store/${slug}/?locale=${locale}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const store: StorefrontStore | undefined = data?.store;
  const navigation: Navigation = store?.navigation || {};
  const footerConfig: FooterConfig = store?.footer_config || {};

  const applyThemeVariables = useCallback((theme: ThemeConfig | null | undefined, dark: boolean) => {
    if (!theme) return;
    const root = document.documentElement;

    if (theme.colors) {
      // Dark mode overrides — use theme config dark variants when available, else fallback
      const darkDefaults: Record<string, string> = {
        background: "#111827",
        surface: "#1f2937",
        text: "#f3f4f6",
        textSecondary: "#9ca3af",
        border: "#374151",
        primary: theme.colors.primaryDark || theme.colors.primary,
        secondary: theme.colors.secondaryDark || theme.colors.secondary,
        accent: theme.colors.accentDark || theme.colors.accent,
      };

      const darkOverrides: Record<string, string> = dark ? darkDefaults : {};

      const resolvedColors = { ...theme.colors, ...darkOverrides };

      const colorMap: Record<string, string> = {
        primary: "--color-primary",
        secondary: "--color-secondary",
        accent: "--color-accent",
        background: "--color-bg",
        surface: "--color-surface",
        text: "--color-text",
        textSecondary: "--color-text-secondary",
        border: "--color-border",
        error: "--color-error",
        success: "--color-success",
        warning: "--color-warning",
      };

      for (const [key, cssVar] of Object.entries(colorMap)) {
        if (resolvedColors[key]) {
          root.style.setProperty(cssVar, resolvedColors[key]);
        }
      }

      // Generate full shade palettes for primary, secondary, accent
      const shadeKeys = ["primary", "secondary", "accent"] as const;
      for (const colorKey of shadeKeys) {
        const hex = resolvedColors[colorKey];
        if (hex) {
          const shades = generateColorShades(hex, colorKey);
          for (const [varName, value] of Object.entries(shades)) {
            root.style.setProperty(varName, value);
          }
        }
      }
    }

    if (theme.borderRadius) {
      root.style.setProperty("--radius-sm", `${theme.borderRadius.small ?? 4}px`);
      root.style.setProperty("--radius-md", `${theme.borderRadius.medium ?? 8}px`);
      root.style.setProperty("--radius-lg", `${theme.borderRadius.large ?? 12}px`);
      root.style.setProperty("--radius-full", `${theme.borderRadius.full ?? 9999}px`);
    }

    if (theme.typography) {
      if (theme.typography.headingFont) root.style.setProperty("--font-heading", theme.typography.headingFont);
      if (theme.typography.bodyFont) root.style.setProperty("--font-body", theme.typography.bodyFont);
      if (theme.typography.baseFontSize) root.style.setProperty("--font-size-base", `${theme.typography.baseFontSize}px`);
      if (theme.typography.scale) root.style.setProperty("--font-scale", `${theme.typography.scale}`);
      if (theme.typography.lineHeight) root.style.setProperty("--line-height-base", `${theme.typography.lineHeight}`);
    }

    if (theme.spacing) {
      if (theme.spacing.sectionPaddingY) root.style.setProperty("--section-padding-y", `${theme.spacing.sectionPaddingY}px`);
      if (theme.spacing.sectionPaddingX) root.style.setProperty("--section-padding-x", `${theme.spacing.sectionPaddingX}px`);
      if (theme.spacing.containerMaxWidth) root.style.setProperty("--container-max-width", `${theme.spacing.containerMaxWidth}px`);
      if (theme.spacing.gridGap) root.style.setProperty("--grid-gap", `${theme.spacing.gridGap}px`);
    }

    if (theme.animations) {
      const durationMap: Record<string, string> = { fast: "0.15s", normal: "0.3s", slow: "0.5s" };
      const raw = theme.animations.duration || "0.3s";
      const duration = theme.animations.enabled ? (durationMap[raw] || raw) : "0s";
      root.style.setProperty("--transition-duration", duration);
      root.style.setProperty("--transition-easing", theme.animations.easing || "ease");
    }
  }, []);

  // Dark mode state — derived from DOM
  const subscribeDark = useCallback(() => () => {}, []);
  const isDark = useSyncExternalStore(
    subscribeDark,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  const toggleDark = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    if (typeof window !== "undefined") {
      localStorage.setItem("tujjar-dark-mode", String(next));
    }
    // Re-apply theme CSS variables with dark mode
    applyThemeVariables(store?.theme_config || null, next);
  }, [store?.theme_config, applyThemeVariables]);

  // Apply theme CSS variables
  useEffect(() => {
    const theme = store?.theme_config;
    const dark = document.documentElement.classList.contains("dark");
    applyThemeVariables(theme, dark);

    // Initialize dark mode from localStorage or theme default
    if (theme?.darkMode?.enabled) {
      const stored = localStorage.getItem("tujjar-dark-mode");
      const shouldBeDark = stored !== null ? stored === "true" : theme.darkMode.default;
      if (shouldBeDark !== dark) {
        document.documentElement.classList.toggle("dark", shouldBeDark);
        applyThemeVariables(theme, shouldBeDark);
      }
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [store?.theme_config, applyThemeVariables]);

  // Apply favicon
  useEffect(() => {
    if (store?.favicon_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = store.favicon_url;
    }
  }, [store?.favicon_url]);

  // Apply SEO metadata
  useEffect(() => {
    if (store) {
      document.title = store.seo_title || store.name;
      const setMeta = (name: string, content: string) => {
        let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
        if (!el) {
          el = document.createElement("meta");
          if (name.startsWith("og:")) {
            el.setAttribute("property", name);
          } else {
            el.setAttribute("name", name);
          }
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };
      if (store.seo_description) {
        setMeta("description", store.seo_description);
      }
      if (store.og_image) {
        setMeta("og:image", store.og_image);
      }
      if (store.twitter_card) {
        setMeta("twitter:card", store.twitter_card);
      }
    }
  }, [store]);

  // Load Google Fonts from theme typography
  useEffect(() => {
    const theme = store?.theme_config;
    if (!theme?.typography) return;
    const fonts = new Set<string>();
    if (theme.typography.headingFont && !theme.typography.headingFont.startsWith("system")) {
      fonts.add(theme.typography.headingFont);
    }
    if (theme.typography.bodyFont && !theme.typography.bodyFont.startsWith("system")) {
      fonts.add(theme.typography.bodyFont);
    }
    for (const font of fonts) {
      const id = `google-font-${font.replace(/\s+/g, "-").toLowerCase()}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [store?.theme_config]);

  // Inject custom CSS from theme assets
  useEffect(() => {
    const assets = (store as unknown as { theme_assets?: Record<string, unknown> })?.theme_assets;
    const customCss = assets?.custom_css || "";
    if (!customCss) return;
    const id = "theme-custom-css";
    let style = document.getElementById(id) as HTMLStyleElement;
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = customCss as string;
  }, [store]);

  const prefixLink = (url: string) => {
    if (url.startsWith("http")) return url;
    if (subdomainSlug) return `/${locale}${url}`;
    if (pathSlug) return `/${locale}/shop/${pathSlug}${url}`;
    return url;
  };

  const defaultNavLinks: NavLink[] = [
    { label: "Home", url: "/" },
    { label: "Shop", url: "/shop" },
  ];

  const defaultFooterColumns: FooterColumn[] = [
    {
      title: "Shop",
      links: [
        { label: "All Products", url: "/shop" },
        { label: "Collections", url: "/shop/collections" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "FAQ", url: "/faq" },
        { label: "Shipping", url: "/shipping" },
        { label: "Returns", url: "/returns" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", url: "/about" },
        { label: "Contact", url: "/contact" },
      ],
    },
  ];

  const navLinks = navigation.links?.length
    ? [...navigation.links].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : defaultNavLinks;

  const resolveLabel = (label: string | Record<string, string> | undefined): string => {
    if (!label) return "";
    if (typeof label === "string") return label;
    return label[locale] || label.en || "";
  };

  const resolveField = (field: string | Record<string, string> | undefined, fallback: string): string => {
    if (!field) return fallback;
    if (typeof field === "string") return field;
    return field[locale] || field.en || fallback;
  };

  const footerColumns = footerConfig.columns?.length
    ? footerConfig.columns
    : defaultFooterColumns;

  const logoText = resolveLabel(navigation.logo_text as string | Record<string, string> | undefined) || store?.name || tNav("store");
  const copyrightText = resolveField(footerConfig.copyright as string | Record<string, string> | undefined, tNav("poweredBy"));

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <AnnouncementBar
        config={store?.settings?.announcement_bar as ReturnType<typeof Object> as { enabled: boolean; text: string; link_url?: string; link_label?: string; background_color?: string; text_color?: string; dismissible?: boolean } | undefined}
        storeSlug={store?.slug || ""}
      />
      <header className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={slug ? (subdomainSlug ? `/${locale}` : `/${locale}/shop/${slug}`) : "#"} className="flex items-center gap-2 text-xl font-bold" style={{ color: "var(--color-text)" }}>
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-8 w-auto object-contain" />
            ) : null}
            {logoText}
          </Link>
          <nav className="hidden gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.url}
                href={prefixLink(link.url)}
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                {resolveLabel(link.label)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <LocaleSwitcher variant="header" />
            {store?.theme_config?.darkMode?.enabled && store.theme_config.darkMode.toggle && (
              <button
                onClick={toggleDark}
                className="rounded-lg p-2 transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}
            {navigation.cta_button?.enabled && (
              <Link
                href={prefixLink(navigation.cta_button.url)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: "var(--color-primary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-primary-700)")}
              >
                {resolveLabel(navigation.cta_button?.label)}
              </Link>
            )}
            <button
              className="rounded-lg p-2 transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href={slug ? (subdomainSlug ? `/${locale}/shop/cart` : `/${locale}/shop/${slug}/shop/cart`) : "#"}
              className="relative rounded-lg p-2 transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white"
                style={{ background: "var(--color-primary)" }}>
                0
              </span>
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-lg p-2 transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h4 className="mb-3 font-semibold" style={{ color: "var(--color-text)" }}>{resolveLabel(column.title)}</h4>
                <div className="space-y-2">
                   {column.links.map((link) => (
                    <Link
                      key={`${column.title}-${link.label}`}
                      href={prefixLink(link.url)}
                      className="block transition-colors"
                      style={{ color: "var(--color-text-secondary)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                    >
                      {resolveLabel(link.label)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {footerConfig.social_links && Object.keys(footerConfig.social_links).length > 0 && (
            <div className="mt-6 flex items-center gap-4">
              {Object.entries(footerConfig.social_links).map(([platform, url]) => {
                if (!url) return null;
                const Icon = SOCIAL_ICONS[platform];
                return (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                  >
                    {Icon ? <Icon className="h-5 w-5" /> : <span className="text-xs">{platform}</span>}
                  </a>
                );
              })}
            </div>
          )}
          <div className="mt-8 border-t pt-4 text-center text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            {copyrightText}
          </div>
        </div>
      </footer>
    </div>
  );
}
