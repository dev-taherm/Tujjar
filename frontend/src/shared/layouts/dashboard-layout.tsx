"use client";

import { Sidebar } from "./sidebar";
import { VerificationBanner } from "@/shared/components/verification-banner";
import { NotificationsBell } from "@/features/notifications/notifications-bell";
import { BrandLogo } from "@/shared/brand/logo";
import { CommandPalette, ThemeToggle } from "@/shared/ui";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { useUIStore } from "@/stores";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Menu, Search } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleMobile, openCommand } = useUIStore();
  const locale = useLocale();
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const searchLabel =
    locale === "ar" ? "ابحث عن صفحة، طلب، منتج…" : "Search pages, orders, products…";

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Mobile topbar */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-panel px-3 md:hidden">
        <button
          onClick={toggleMobile}
          aria-label="Open navigation"
          className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-rail active:scale-[0.98] active:bg-rail"
        >
          <Menu className="h-5 w-5" />
        </button>
        <BrandLogo />
        <button
          onClick={openCommand}
          aria-label={searchLabel}
          className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-rail active:scale-[0.98]"
        >
          <Search className="h-5 w-5" />
        </button>
        <div className="ms-auto">
          <NotificationsBell />
        </div>
      </div>

      {/* Desktop topbar */}
      <div className="sticky top-0 z-30 hidden h-14 items-center gap-3 border-b border-line bg-panel/85 px-6 backdrop-blur-sm md:flex">
        <button
          onClick={openCommand}
          className="flex h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-line bg-canvas px-3 text-sm text-ink-soft shadow-sm transition-colors hover:border-primary-300 hover:text-ink"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">{searchLabel}</span>
          <kbd className="ms-auto shrink-0 rounded-md border border-line bg-rail px-1.5 py-0.5 text-[10px] font-semibold">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>

        <div className="ms-auto flex items-center gap-1">
          <NotificationsBell />
          <ThemeToggle variant="icon" />
          <LocaleSwitcher variant="header" />
        </div>
      </div>

      <Sidebar />
      <main
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "md:ms-64" : "md:ms-16"
        )}
      >
        <VerificationBanner />
        <div className="p-4 md:p-8">{children}</div>
      </main>

      <CommandPalette />
    </div>
  );
}
