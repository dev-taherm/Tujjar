"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n";
import { Globe } from "lucide-react";

interface LocaleSwitcherProps {
  variant?: "sidebar" | "header" | "floating";
}

export function LocaleSwitcher({ variant = "sidebar" }: LocaleSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = locale === "en" ? "ar" : "en";

  const switchLocale = () => {
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    router.replace(pathname, { locale: nextLocale });
  };

  if (variant === "floating") {
    return (
      <button
        onClick={switchLocale}
        className="fixed end-4 top-4 z-50 flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-ink-soft shadow-sm hover:bg-rail hover:text-ink"
        title={nextLocale === "en" ? "Switch to English" : "التبديل إلى العربية"}
      >
        <Globe className="h-4 w-4" />
        <span>{locale === "en" ? "العربية" : "English"}</span>
      </button>
    );
  }

  if (variant === "header") {
    return (
      <button
        onClick={switchLocale}
        className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-rail hover:text-ink"
        title={nextLocale === "en" ? "Switch to English" : "التبديل إلى العربية"}
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{locale === "en" ? "AR" : "EN"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={switchLocale}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-panel hover:text-ink"
      title={nextLocale === "en" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe className="h-5 w-5 flex-shrink-0" />
      <span>{locale === "en" ? "العربية" : "English"}</span>
    </button>
  );
}
