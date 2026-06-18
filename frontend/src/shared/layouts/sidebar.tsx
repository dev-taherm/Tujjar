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

export function Sidebar() {
  const pathname = usePathname();
  const { user, organization } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const t = useTranslations("dashboard.nav");
  const locale = useLocale();

  const [expandedGroups, setExpandedGroups] = useState<string[]>(getStoredExpanded);

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = prev.includes(groupKey)
        ? prev.filter((k) => k !== groupKey)
        : [...prev, groupKey];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Auto-expand group containing active route
  useEffect(() => {
    for (const group of navigation) {
      for (const item of group.items) {
        const href = `/${locale}${item.href}`;
        if (pathname === href || pathname.startsWith(href + "/")) {
          setExpandedGroups((prev) => {
            if (prev.includes(group.groupKey)) return prev;
            const next = [...prev, group.groupKey];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
          return;
        }
      }
    }
  }, [pathname, locale]);

  return (
    <aside
      className={cn(
        "fixed start-0 top-0 z-40 h-screen border-e border-gray-200 bg-white transition-all",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {sidebarOpen && (
            <Link href={`/${locale}/dashboard`} className="text-xl font-bold text-primary-600">
              Tujjar
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronLeft
              className={cn("h-5 w-5 transition-transform rtl:rotate-180", !sidebarOpen && "rotate-180")}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {navigation.map((group) => {
            const isExpanded = expandedGroups.includes(group.groupKey);
            const hasActiveItem = group.items.some((item) => {
              const href = `/${locale}${item.href}`;
              return pathname === href || pathname.startsWith(href + "/");
            });

            return (
              <div key={group.groupKey} className="mb-1">
                {/* Group header */}
                <button
                  onClick={() => sidebarOpen && toggleGroup(group.groupKey)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                    sidebarOpen ? "cursor-pointer hover:bg-gray-50" : "cursor-default",
                    hasActiveItem ? "text-primary-600" : "text-gray-400"
                  )}
                  title={t(group.groupKey)}
                >
                  {sidebarOpen ? (
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

                {/* Group items */}
                {(!sidebarOpen || isExpanded) &&
                  group.items.map((item) => {
                    const href = `/${locale}${item.href}`;
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                      <Link
                        key={item.nameKey}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          sidebarOpen ? "ms-2" : "justify-center",
                          isActive
                            ? "bg-primary-50 text-primary-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                        title={!sidebarOpen ? t(item.nameKey) : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {sidebarOpen && <span>{t(item.nameKey)}</span>}
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
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  sidebarOpen ? "" : "justify-center",
                  pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`)
                    ? "bg-red-50 text-red-700"
                    : "text-red-600 hover:bg-red-50 hover:text-red-700"
                )}
                title={!sidebarOpen ? t("adminPanel") : undefined}
              >
                <Shield className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{t("adminPanel")}</span>}
              </Link>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-4">
          {sidebarOpen && user && (
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
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              sidebarOpen ? "" : "justify-center"
            )}
            title={!sidebarOpen ? t("signOut") : undefined}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>{t("signOut")}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
