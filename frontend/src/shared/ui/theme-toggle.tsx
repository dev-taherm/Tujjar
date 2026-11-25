"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLocale } from "next-intl";
import { useUIStore } from "@/stores";
import { applyDocumentTheme, readStoredTheme, resolveTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** `sidebar`: full-width row (expanded/collapsed rail). `icon`: bare button. */
  variant?: "sidebar" | "icon";
}

/**
 * Light/dark switch for the app shell. The pre-paint script in the root
 * layout already set `.dark`; this adopts the stored preference into the
 * UI store, keeps `.dark` in sync with every change, and follows OS
 * changes while the user has not picked explicitly.
 */
export function ThemeToggle({ variant = "sidebar" }: ThemeToggleProps) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    if (stored !== "system") applyDocumentTheme(stored);
    setMounted(true);
  }, [setTheme]);

  useEffect(() => {
    if (!mounted) return;
    applyDocumentTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyDocumentTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, mounted]);

  const isDark = theme === "system" ? resolveTheme("system") : theme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  const label = isDark
    ? locale === "ar"
      ? "الوضع النهاري"
      : "Switch to light mode"
    : locale === "ar"
      ? "الوضع الليلي"
      : "Switch to dark mode";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        title={label}
        aria-label={label}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-rail hover:text-ink active:scale-[0.98]"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      className={cn(
        "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-panel hover:text-ink active:scale-[0.98]"
      )}
    >
      {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
      <span>{label}</span>
    </button>
  );
}
