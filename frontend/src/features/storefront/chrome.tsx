"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart, User, Search, Menu, X, Facebook, Twitter, Instagram, Youtube, Linkedin, Sun, Moon, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/shared/ui";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { AnnouncementBar } from "@/features/store/announcement-bar";
import { useCustomerAuthStore } from "@/stores/customer-auth";
import { useGuestCartStore } from "@/stores/guest-cart";
import type { StorefrontStore } from "@/lib/server/storefront-api";

interface NavLink {
  label: string;
  url: string;
  order?: number;
}

interface FooterColumn {
  title: string;
  links: { label: string; url: string }[];
}

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
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

/**
 * Storefront chrome (announcement bar, header, footer) as a client island.
 * All store data arrives as server-fetched props — the chrome performs no
 * data fetching and applies no theme styling (theme CSS is rendered
 * server-side by the per-store layout).
 */
export function StorefrontChrome({
  store,
  slug,
  isSubdomain,
  children,
}: {
  store: StorefrontStore;
  slug: string;
  isSubdomain: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const tNav = useTranslations("storefront.header");
  const tSearch = useTranslations("storefront.search");

  // Customer session state (client-only concerns)
  const { customer: customerAuth, isAuthenticated: isCustomerAuth } = useCustomerAuthStore();
  const guestCartItems = useGuestCartStore((s) => s.items);
  const guestCartCount = guestCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const { data: customerCart } = useQuery<{ items_count: number }>({
    queryKey: ["customer-cart-count", slug],
    queryFn: async () => {
      try {
        const { customerClient } = await import("@/api/customer-client");
        const { data } = await customerClient.get(`/customers/cart/`, { params: { store: slug } });
        const carts = data.results || data || [];
        const activeCart = Array.isArray(carts) ? carts[0] : null;
        return { items_count: activeCart?.items?.length ?? 0 };
      } catch {
        return { items_count: 0 };
      }
    },
    enabled: isCustomerAuth && !!slug,
    staleTime: 30_000,
  });
  const cartCount = isCustomerAuth ? (customerCart?.items_count ?? 0) : guestCartCount;

  const toggleDark = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tujjar-dark-mode", String(next));
  };

  const navigation = store?.navigation || {};
  const footerConfig = store?.footer_config || {};

  const prefixLink = (url: string) => {
    if (url.startsWith("http")) return url;
    if (isSubdomain) return `/${locale}${url}`;
    if (url === "/blog") return `/${locale}/shop/${slug}/shop/blog`;
    if (url === "/shop") return `/${locale}/shop/${slug}/shop`;
    if (url.startsWith("/shop/")) return `/${locale}/shop/${slug}${url}`;
    if (url === "/collections") return `/${locale}/shop/${slug}/shop/collections`;
    return `/${locale}/shop/${slug}${url}`;
  };

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

  const navLinks = navigation.links?.length
    ? [...navigation.links].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : defaultNavLinks;

  const footerColumns = footerConfig.columns?.length ? footerConfig.columns : defaultFooterColumns;

  const logoText = resolveLabel(navigation.logo_text as string | Record<string, string> | undefined) || store?.name || tNav("store");

  const copyrightText = resolveField(footerConfig.copyright as string | Record<string, string> | undefined, tNav("poweredBy"));

  const announcementConfig = store?.settings?.announcement_bar as
    | { enabled: boolean; text: string; link_url?: string; link_label?: string; background_color?: string; text_color?: string; dismissible?: boolean }
    | undefined;

  const homeHref = isSubdomain ? `/${locale}` : `/${locale}/shop/${slug}`;
  const cartHref = isSubdomain ? `/${locale}/shop/cart` : `/${locale}/shop/${slug}/shop/cart`;
  const accountHref = isSubdomain ? `/${locale}/shop/account` : `/${locale}/shop/${slug}/account`;
  const loginHref = isSubdomain ? `/${locale}/shop/login` : `/${locale}/shop/${slug}/login`;
  const shopHref = isSubdomain ? `/${locale}/shop` : `/${locale}/shop/${slug}/shop`;

  // Header search: expands into an inline bar that submits to the listing
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Close overlays on navigation — adjust during render (React-recommended
  // pattern for state derived from prop/route changes; passes the lint rule)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
    setSearchOpen(false);
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const sp = new URLSearchParams({ search: q });
    router.push(`${shopHref}?${sp.toString()}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  /* ── Header/footer layout options ───────────────────────────────────────
   * All keys are optional on navigation/footer_config; defaults reproduce
   * the original single layout so existing stores render unchanged. */
  const isSticky = navigation.header_sticky !== false;
  const isCenteredHeader = navigation.header_layout === "centered";
  const showSearch = navigation.header_show_search !== false;
  const showCart = navigation.header_show_cart !== false;
  const headerHeight = Math.max(48, Math.min(Number(navigation.header_height) || 64, 120));
  const logoHeight = Math.max(16, Math.min(Number(navigation.logo_height) || 32, 80));
  const footerLayout = footerConfig.layout || "columns";
  const showSocial = footerConfig.show_social !== false;
  const showCopyright = footerConfig.show_copyright !== false;
  const containerStyle: React.CSSProperties = { maxWidth: "var(--container-max-width, 80rem)" };

  // Footer socials: fall back to the store-level social links (Branding tab)
  // when the footer has none of its own.
  const footerSocial =
    footerConfig.social_links && Object.keys(footerConfig.social_links).some((k) => footerConfig.social_links?.[k])
      ? footerConfig.social_links
      : ((store?.settings?.social_links as Record<string, string> | undefined) || {});
  const hasSocial = showSocial && Object.values(footerSocial).some(Boolean);

  const gridClass =
    footerColumns.length >= 4
      ? "grid-cols-2 md:grid-cols-4"
      : footerColumns.length === 3
        ? "grid-cols-2 md:grid-cols-3"
        : footerColumns.length === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  const navLinksJsx = (
    <>
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
    </>
  );

  const logoLink = (
    <Link href={slug ? homeHref : "#"} className="flex min-w-0 items-center gap-2 text-xl font-bold" style={{ color: "var(--color-text)" }}>
      {store?.logo_url ? (
        <img src={store.logo_url} alt={store.name} className="w-auto object-contain" style={{ height: logoHeight }} />
      ) : null}
      <span className="max-w-32 truncate sm:max-w-none sm:truncate-none">{logoText}</span>
    </Link>
  );

  const headerActions = (
    <>
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
          <Sun className="hidden h-5 w-5 dark:block" />
          <Moon className="h-5 w-5 dark:hidden" />
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
      {showSearch && (
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label={searchOpen ? "Close search" : "Search products"}
          className="rounded-lg p-2 transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
      )}
      {showCart && (
        <Link
          href={slug ? cartHref : "#"}
          className="relative rounded-lg p-2 transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white"
            style={{ background: "var(--color-primary)" }}>
            {cartCount}
          </span>
        </Link>
      )}
      {isCustomerAuth && customerAuth ? (
        <div className="flex items-center gap-2">
          <Link
            href={slug ? accountHref : "#"}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{customerAuth.first_name || customerAuth.email}</span>
          </Link>
          <button
            onClick={() => {
              useCustomerAuthStore.getState().logout();
              window.location.reload();
            }}
            className="rounded-lg p-2 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Link
          href={slug ? loginHref : "#"}
          className="rounded-lg p-2 transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <User className="h-5 w-5" />
        </Link>
      )}
    </>
  );

  const mobileMenuButton = (
    <button
      className="rounded-lg p-2 md:hidden"
      onClick={() => setMobileNavOpen(!mobileNavOpen)}
      aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
      style={{ color: "var(--color-text)" }}
    >
      {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );

  const socialIconsJsx = (className: string) => (
    <div className={className}>
      {Object.entries(footerSocial).map(([platform, url]) => {
        if (!url) return null;
        const Icon = SOCIAL_ICONS[platform];
        return (
          <a
            key={platform}
            href={url}
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
  );

  const footerColumnsJsx = (
    <div className={`${gridClass} grid gap-8 text-sm${footerLayout === "stacked" ? " text-center" : ""}`} style={{ color: "var(--color-text-secondary)" }}>
      {footerColumns.map((column) => (
        <div key={resolveLabel(column.title)}>
          <h4 className="mb-3 font-semibold" style={{ color: "var(--color-text)" }}>{resolveLabel(column.title)}</h4>
          <div className="space-y-2">
             {column.links.map((link) => (
              <Link
                key={`${resolveLabel(column.title)}-${resolveLabel(link.label)}`}
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
  );

  const copyrightJsx = showCopyright ? (
    <div className="mt-8 border-t pt-4 text-center text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
      {copyrightText}
    </div>
  ) : null;

  return (
    <div className="storefront min-h-screen" style={{ background: "var(--color-bg)" }}>
      <AnnouncementBar config={announcementConfig} storeSlug={store?.slug || ""} />
      <header
        className={`${isSticky ? "sticky top-0" : "relative"} z-40 border-b backdrop-blur`}
        style={{
          borderColor: "var(--color-border)",
          background: "color-mix(in srgb, var(--color-bg) 85%, transparent)",
        }}
      >
        {isCenteredHeader ? (
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-8" style={containerStyle}>
            <div className="flex items-center justify-between" style={{ height: headerHeight }}>
              <div className="flex min-w-0 flex-1 items-center">{mobileMenuButton}</div>
              <div className="shrink-0">{logoLink}</div>
              <div className="flex flex-1 items-center justify-end">{headerActions}</div>
            </div>
            <nav className="hidden justify-center gap-6 pb-3 md:flex">{navLinksJsx}</nav>
          </div>
        ) : (
          <div
            className="mx-auto flex w-full items-center justify-between px-4 sm:px-6 lg:px-8"
            style={{ ...containerStyle, height: headerHeight }}
          >
            <div className="flex min-w-0 items-center gap-2">
              {mobileMenuButton}
              {logoLink}
            </div>
            <nav className="hidden gap-6 md:flex">{navLinksJsx}</nav>
            <div className="flex items-center gap-4">{headerActions}</div>
          </div>
        )}
        {searchOpen && (
          <form
            onSubmit={submitSearch}
            className="border-t px-4 py-3 sm:px-6 lg:px-8"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="mx-auto flex gap-2" style={containerStyle}>
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tSearch("placeholder")}
                className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none"
                style={{
                  borderColor: "var(--color-primary)",
                  color: "var(--color-text)",
                  background: "var(--color-surface)",
                }}
              />
              <Button type="submit" size="sm">
                {tSearch("submit")}
              </Button>
            </div>
          </form>
        )}
        {mobileNavOpen && (
          <nav
            className="border-t px-4 py-3 md:hidden"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.url}
                  href={prefixLink(link.url)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ color: "var(--color-text)" }}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {resolveLabel(link.label)}
                </Link>
              ))}
              <Link
                href={cartHref}
                className="block rounded-lg px-3 py-2 text-sm font-medium"
                style={{ color: "var(--color-text)" }}
                onClick={() => setMobileNavOpen(false)}
              >
                {tNav("cart")}
              </Link>
              {isCustomerAuth ? (
                <Link
                  href={accountHref}
                  className="block rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ color: "var(--color-text)" }}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {tNav("account")}
                </Link>
              ) : (
                <Link
                  href={loginHref}
                  className="block rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ color: "var(--color-primary)" }}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {tNav("signIn")}
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        {footerLayout === "minimal" ? (
          <div className="mx-auto w-full px-4 py-8 text-center sm:px-6 lg:px-8" style={containerStyle}>
            {hasSocial && socialIconsJsx("flex items-center justify-center gap-4")}
            {copyrightJsx}
          </div>
        ) : (
          <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8" style={containerStyle}>
            {footerLayout === "stacked" && (
              <div className="mb-6 text-center">
                <Link href={slug ? homeHref : "#"} className="inline-block text-xl font-bold" style={{ color: "var(--color-text)" }}>
                  {logoText}
                </Link>
              </div>
            )}
            {footerColumnsJsx}
            {hasSocial && socialIconsJsx(footerLayout === "stacked" ? "mt-6 flex items-center justify-center gap-4" : "mt-6 flex items-center gap-4")}
            {copyrightJsx}
          </div>
        )}
      </footer>
    </div>
  );
}
