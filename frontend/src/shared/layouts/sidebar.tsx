"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { LogOut, ChevronLeft, ChevronRight, Shield, X } from "lucide-react";
import { useAuthStore, useUIStore } from "@/stores";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { BrandLogo, LogoMark } from "@/shared/brand/logo";
import { OrgSwitcher } from "@/features/auth/org-switcher";
import { navigation } from "./dashboard-nav";
import { useState, useEffect, useCallback } from "react";

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
      <div className="flex h-16 items-center justify-between border-b border-line px-3 md:px-4">
        <Link href={`/${locale}/dashboard`} className="flex items-center" title="Tujjar">
          {sidebarExpanded ? <BrandLogo /> : <LogoMark className="h-7 w-7 text-primary-500" />}
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSidebar}
            className="hidden rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-panel active:scale-[0.98] md:block"
          >
            <ChevronLeft
              className={cn("h-5 w-5 transition-transform rtl:rotate-180", !sidebarExpanded && "rotate-180")}
            />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-panel active:scale-[0.98] md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {sidebarExpanded && (
        <div className="border-b border-line px-2 py-2">
          <OrgSwitcher />
        </div>
      )}

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
                  sidebarExpanded ? "cursor-pointer hover:bg-panel active:scale-[0.98]" : "cursor-default",
                  hasActiveItem ? "text-primary-600" : "text-ink-soft/80"
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
                        "relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] active:bg-panel",
                        sidebarExpanded ? "ms-2" : "justify-center",
                        isActive
                          ? "bg-primary-50 font-semibold text-primary-600"
                          : "text-ink-soft hover:bg-panel hover:text-ink",
                        isActive &&
                          sidebarExpanded &&
                          "before:absolute before:-start-3 before:top-2.5 before:bottom-2.5 before:w-[3px] before:rounded-full before:bg-primary-600 before:content-['']"
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
            <div className="my-3 border-t border-line" />
            <Link
              href={`/${locale}/admin`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98]",
                sidebarExpanded ? "ms-2" : "justify-center",
                pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`)
                  ? "bg-error-soft text-error"
                  : "text-error hover:bg-error-soft hover:text-error"
              )}
              title={!sidebarExpanded ? t("adminPanel") : undefined}
            >
              <Shield className="h-5 w-5 flex-shrink-0" />
              {sidebarExpanded && <span>{t("adminPanel")}</span>}
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-line p-4">
        {sidebarExpanded && user && (
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-ink">
              {user.full_name || user.email}
            </p>
            {organization && (
              <p className="truncate text-xs text-ink-soft">{organization.name}</p>
            )}
          </div>
        )}
        <LocaleSwitcher variant="sidebar" />
        <ThemeToggle variant="sidebar" />
        <button
          onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = `/${locale}/login`;
          }}
          className={cn(
            "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-panel hover:text-ink active:scale-[0.98] active:bg-panel",
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
          "fixed start-0 top-0 z-40 hidden h-dvh border-e border-line bg-rail transition-all md:block",
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
          "fixed start-0 top-0 z-50 h-dvh w-64 border-e border-line bg-rail transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
