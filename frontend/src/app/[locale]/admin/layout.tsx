"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAuthStore } from "@/stores";
import { ErrorBoundary } from "@/shared/components/error-boundary";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Store,
  CreditCard,
  Settings,
  Shield,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";

const emptySubscribe = () => () => {};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin.nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const adminNav = [
    { name: t("overview"), href: "/admin", icon: LayoutDashboard },
    { name: t("users"), href: "/admin/users", icon: Users },
    { name: t("organizations"), href: "/admin/organizations", icon: Building2 },
    { name: t("stores"), href: "/admin/stores", icon: Store },
    { name: t("plans"), href: "/admin/plans", icon: CreditCard },
    { name: t("settings"), href: "/admin/settings", icon: Settings },
  ];

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user) {
      router.push(`/${locale}/login`);
    } else if (!user.is_staff && !user.is_superuser) {
      router.push(`/${locale}/dashboard`);
    }
  }, [hydrated, isAuthenticated, user, router, locale]);

  if (!hydrated || !isAuthenticated || !user || (!user.is_staff && !user.is_superuser)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas">
      <aside className="fixed start-0 top-0 z-40 flex h-screen w-64 flex-col border-e border-line bg-panel">
        <div className="flex h-16 items-center gap-2 border-b border-line px-4">
          <Shield className="h-6 w-6 text-error" />
          <span className="text-lg font-bold text-ink">{t("adminPanel")}</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminNav.map((item) => {
            const href = `/${locale}${item.href}`;
            const isActive = pathname === href || (item.href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={item.name}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-error-soft text-error"
                    : "text-ink-soft hover:bg-rail hover:text-ink"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3 space-y-1">
          <LocaleSwitcher variant="sidebar" />
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-rail hover:text-ink"
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            {t("backToDashboard")}
          </Link>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.href = `/${locale}/login`;
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-rail hover:text-ink"
          >
            <LogOut className="h-5 w-5" />
            {t("signOut")}
          </button>
        </div>
      </aside>

      <main className="ms-64 flex-1 overflow-y-auto">
        <div className="p-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
