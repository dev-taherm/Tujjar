"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingCart, User, Search } from "lucide-react";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";

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

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const slug = pathname.split("/")[2] || "";
  const locale = useLocale();
  const tHeader = useTranslations("storefront.header");

  const { data } = useQuery({
    queryKey: ["storefront", slug, locale],
    queryFn: async () => {
      const res = await fetch(`/api/v1/store/${slug}/?locale=${locale}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const store = data?.store;
  const navigation: Navigation = store?.navigation || {};
  const footerConfig: FooterConfig = store?.footer_config || {};

  const prefixLink = (url: string) =>
    url.startsWith("http") ? url : `/${locale}/shop/${slug}${url}`;

  const defaultNavLinks: NavLink[] = [
    { label: "Home", url: `/${locale}` },
    { label: "Shop", url: `/${locale}/shop` },
  ];

  const defaultFooterColumns: FooterColumn[] = [
    {
      title: "Shop",
      links: [
        { label: "All Products", url: `/${locale}/shop` },
        { label: "Collections", url: `/${locale}/shop/collections` },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "FAQ", url: `/${locale}/faq` },
        { label: "Shipping", url: `/${locale}/shipping` },
        { label: "Returns", url: `/${locale}/returns` },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", url: `/${locale}/about` },
        { label: "Contact", url: `/${locale}/contact` },
      ],
    },
  ];

  const navLinks = navigation.links?.length
    ? navigation.links.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : defaultNavLinks;

  const footerColumns = footerConfig.columns?.length
    ? footerConfig.columns
    : defaultFooterColumns;

  const logoText = navigation.logo_text || store?.name || tHeader("store");

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/${locale}/shop/${slug}`} className="text-xl font-bold text-gray-900">
            {logoText}
          </Link>
          <nav className="hidden gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.url}
                href={prefixLink(link.url)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <LocaleSwitcher variant="header" />
            {navigation.cta_button?.enabled && (
              <Link
                href={prefixLink(navigation.cta_button.url)}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                {navigation.cta_button.label}
              </Link>
            )}
            <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Search className="h-5 w-5" />
            </button>
            <Link href={`/${locale}/shop/${slug}/shop/cart`} className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">
                0
              </span>
            </Link>
            <Link href={`/${locale}/login`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-sm text-gray-500">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h4 className="mb-3 font-semibold text-gray-900">{column.title}</h4>
                <div className="space-y-2">
                  {column.links.map((link) => (
                    <Link
                      key={link.url}
                      href={prefixLink(link.url)}
                      className="block hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
            {footerConfig.copyright || tHeader("poweredBy")}
          </div>
        </div>
      </footer>
    </div>
  );
}
