"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Palette,
  Image,
  BarChart3,
  CreditCard,
  Settings,
  Bot,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  LayoutTemplate,
  ScrollText,
  PenTool,
  Settings2,
  X,
} from "lucide-react";
import { useAuthStore, useUIStore } from "@/stores";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { useState, useEffect, useCallback } from "react";

interface NavItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  groupKey: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    groupKey: "main",
    items: [
      { nameKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
      { nameKey: "stores", href: "/dashboard/stores", icon: Store },
    ],
  },
  {
    groupKey: "catalog",
    items: [
      { nameKey: "products", href: "/dashboard/products", icon: Package },
      { nameKey: "attributes", href: "/dashboard/products/attributes", icon: Settings2 },
      { nameKey: "pages", href: "/dashboard/pages", icon: FileText },
      { nameKey: "blog", href: "/dashboard/blog", icon: PenTool },
      { nameKey: "media", href: "/dashboard/media", icon: Image },
    ],
  },
  {
    groupKey: "sales",
    items: [
      { nameKey: "orders", href: "/dashboard/orders", icon: ShoppingCart },
      { nameKey: "customers", href: "/dashboard/customers", icon: Users },
    ],
  },
  {
    groupKey: "design",
    items: [
      { nameKey: "themes", href: "/dashboard/themes", icon: Palette },
      { nameKey: "templates", href: "/dashboard/templates", icon: LayoutTemplate },
      { nameKey: "marketplace", href: "/dashboard/marketplace", icon: Palette },
    ],
  },
  {
    groupKey: "engagement",
    items: [
      { nameKey: "analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { nameKey: "ai", href: "/dashboard/ai", icon: Bot },
      { nameKey: "notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    groupKey: "business",
    items: [
      { nameKey: "billing", href: "/dashboard/billing", icon: CreditCard },
      { nameKey: "team", href: "/dashboard/team", icon: Users },
      { nameKey: "auditLog", href: "/dashboard/audit", icon: ScrollText },
      { nameKey: "settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const STORAGE_KEY = "sidebar-expanded";

function getStoredExpanded(): string[] {
  if (typeof window === "undefined") return ["main"];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ["main"];
}

function getExpandedForPath(pathname: string, locale: string, stored: string[]): string[] {
  for (const group of navigation) {
    for (const item of group.items) {
      const href = `/${locale}${item.href}`;
      if (pathname === href || pathname.startsWith(href + "/")) {
        if (!stored.includes(group.groupKey)) {
          const next = [...stored, group.groupKey];
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          }
          return next;
        }
        return stored;
      }
    }
  }
  return stored;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, organization } = useAuthStore();
  const { sidebarOpen, toggleSidebar, mobileOpen, setMobileOpen } = useUIStore();
  const t = useTranslations("dashboard.nav");
  const locale = useLocale();

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() =>
    getExpandedForPath(pathname, locale, getStoredExpanded())
  );

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = prev.includes(groupKey)
        ? prev.filter((k) => k !== groupKey)
        : [...prev, groupKey];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const sidebarExpanded = sidebarOpen;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-3 md:px-4">
        {sidebarExpanded && (
          <Link href={`/${locale}/dashboard`} className="text-xl font-bold text-primary-600">
            Tujjar
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="hidden rounded-lg p-1.5 hover:bg-gray-100 active:scale-[0.98] active:bg-gray-100 md:block"
        >
          <ChevronLeft
            className={cn("h-5 w-5 transition-transform rtl:rotate-180", !sidebarExpanded && "rotate-180")}
          />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 hover:bg-gray-100 active:scale-[0.98] active:bg-gray-100 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {navigation.map((group) => {
          const isExpanded = expandedGroups.includes(group.groupKey);
          const hasActiveItem = group.items.some((item) => {
            const href = `/${locale}${item.href}`;
            return pathname === href || pathname.startsWith(href + "/");
          });

          return (
            <div key={group.groupKey} className="mb-1">
              <button
                onClick={() => (sidebarExpanded ? toggleGroup(group.groupKey) : undefined)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
                  sidebarExpanded ? "cursor-pointer hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100" : "cursor-default",
                  hasActiveItem ? "text-primary-600" : "text-gray-400"
                )}
                title={t(group.groupKey)}
              >
                {sidebarExpanded ? (
                  <>
                    <span className="flex-1 text-start">{t(group.groupKey)}</span>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </>
                ) : (
                  <span className="mx-auto text-[10px]">{t(group.groupKey).charAt(0)}</span>
                )}
              </button>

              {(!sidebarExpanded || isExpanded) &&
                group.items.map((item) => {
                  const href = `/${locale}${item.href}`;
                  const isActive = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={item.nameKey}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] active:bg-gray-100",
                        sidebarExpanded ? "ms-2" : "justify-center",
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      title={!sidebarExpanded ? t(item.nameKey) : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarExpanded && <span>{t(item.nameKey)}</span>}
                    </Link>
                  );
                })}
            </div>
          );
        })}

        {user?.is_staff && (
          <>
            <div className="my-3 border-t border-gray-200" />
            <Link
              href={`/${locale}/admin`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] active:bg-gray-100",
                sidebarExpanded ? "" : "justify-center",
                pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`)
                  ? "bg-red-50 text-red-700"
                  : "text-red-600 hover:bg-red-50 hover:text-red-700"
              )}
              title={!sidebarExpanded ? t("adminPanel") : undefined}
            >
              <Shield className="h-5 w-5 flex-shrink-0" />
              {sidebarExpanded && <span>{t("adminPanel")}</span>}
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-gray-200 p-4">
        {sidebarExpanded && user && (
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-gray-900">
              {user.full_name || user.email}
            </p>
            {organization && (
              <p className="truncate text-xs text-gray-500">{organization.name}</p>
            )}
          </div>
        )}
        <LocaleSwitcher variant="sidebar" />
        <button
          onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = `/${locale}/login`;
          }}
          className={cn(
            "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] active:bg-gray-100",
            sidebarExpanded ? "" : "justify-center"
          )}
          title={!sidebarExpanded ? t("signOut") : undefined}
        >
          <LogOut className="h-5 w-5" />
          {sidebarExpanded && <span>{t("signOut")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed start-0 top-0 z-40 hidden h-dvh border-e border-gray-200 bg-white transition-all md:block",
          sidebarExpanded ? "w-64" : "w-16"
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed start-0 top-0 z-50 h-dvh w-64 border-e border-gray-200 bg-white transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
