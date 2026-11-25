"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRouter as useIntlRouter, usePathname as useIntlPathname } from "@/i18n";
import { useLocale, useTranslations } from "next-intl";
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Layers,
  Tag,
  PenTool,
  Sun,
  Moon,
  Globe,
  CornerDownLeft,
} from "lucide-react";
import { useSearch } from "@/api/search";
import { navigation } from "@/shared/layouts/dashboard-nav";
import { applyDocumentTheme, resolveTheme } from "@/lib/theme";
import { useUIStore } from "@/stores";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

/* Where a search result of a given entity type lands in the dashboard. */
const ENTITY_ROUTES: Record<
  string,
  { href: (id: string) => string; icon: React.ComponentType<{ className?: string }> }
> = {
  product: { href: (id) => `/dashboard/products/${id}`, icon: Package },
  order: { href: (id) => `/dashboard/orders/${id}`, icon: ShoppingCart },
  customer: { href: (id) => `/dashboard/customers/${id}`, icon: Users },
  page: { href: (id) => `/dashboard/pages/${id}`, icon: FileText },
  collection: { href: (id) => `/dashboard/products/collections/${id}`, icon: Layers },
  category: { href: (id) => `/dashboard/products/categories/${id}`, icon: Tag },
  blog: { href: (id) => `/dashboard/blog/${id}`, icon: PenTool },
};

/**
 * The ⌘K palette: navigate to any dashboard page in ≤2 keystrokes, search
 * products/orders/customers through the unified search API, and flip theme
 * or locale. Hand-rolled like the rest of the kit — no dependencies.
 */
export function CommandPalette() {
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const pathname = useIntlPathname();
  const locale = useLocale();
  const t = useTranslations("dashboard.nav");

  const open = useUIStore((s) => s.commandOpen);
  const openCommand = useUIStore((s) => s.openCommand);
  const closeCommand = useUIStore((s) => s.closeCommand);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Global hotkey: ⌘K / Ctrl+K toggles from anywhere in the dashboard. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUIStore.getState().commandOpen ? closeCommand() : openCommand();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openCommand, closeCommand]);

  /* Reset on each open; focus the input. */
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Wait for the overlay to mount before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const { data: searchData, isFetching } = useSearch(query.trim(), Object.keys(ENTITY_ROUTES));

  const navItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [];
    for (const group of navigation) {
      for (const item of group.items) {
        items.push({
          id: `nav:${item.href}`,
          label: t(item.nameKey),
          hint: t(group.groupKey),
          icon: item.icon,
          run: () => router.push(`/${locale}${item.href}`),
        });
      }
    }
    return items;
  }, [t, locale, router]);

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navItems;
    return navItems.filter(
      (i) => i.label.toLowerCase().includes(q) || (i.hint || "").toLowerCase().includes(q)
    );
  }, [navItems, query]);

  const searchItems: CommandItem[] = useMemo(() => {
    if (query.trim().length < 2 || !searchData?.results) return [];
    return searchData.results
      .filter((r) => ENTITY_ROUTES[r.entity_type])
      .slice(0, 8)
      .map((r) => {
        const map = ENTITY_ROUTES[r.entity_type];
        return {
          id: `search:${r.entity_id}`,
          label: r.title,
          hint: r.entity_type,
          icon: map.icon,
          run: () => router.push(`/${locale}${map.href(r.entity_id)}`),
        };
      });
  }, [searchData, query, locale, t, router]);

  const actions: CommandItem[] = useMemo(() => {
    const isDark = theme === "system" ? resolveTheme("system") : theme === "dark";
    const nextLocale = locale === "en" ? "ar" : "en";
    return [
      {
        id: "action:theme",
        label: isDark
          ? locale === "ar"
            ? "الوضع النهاري"
            : "Switch to light mode"
          : locale === "ar"
            ? "الوضع الليلي"
            : "Switch to dark mode",
        icon: isDark ? Sun : Moon,
        run: () => {
          const next = isDark ? "light" : "dark";
          setTheme(next);
          applyDocumentTheme(next);
        },
      },
      {
        id: "action:locale",
        label:
          nextLocale === "en" ? "Switch to English" : "التبديل إلى العربية",
        icon: Globe,
        run: () => {
          document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
          closeCommand();
          intlRouter.replace(pathname, { locale: nextLocale });
        },
      },
    ];
  }, [theme, locale, setTheme, intlRouter, pathname, closeCommand]);

  const items = useMemo(
    () => [...searchItems, ...filteredNav, ...actions],
    [searchItems, filteredNav, actions]
  );

  /* Keep the selection inside bounds when the list changes. */
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(items.length - 1, 0)));
  }, [items.length]);

  if (!open) return null;

  const runItem = (item: CommandItem | undefined) => {
    if (!item) return;
    closeCommand();
    item.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeCommand();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (items.length ? (a + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (items.length ? (a - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runItem(items[active]);
    }
  };

  const placeholder =
    locale === "ar" ? "ابحث عن صفحة، طلب، منتج…" : "Search pages, orders, products…";

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 p-4 backdrop-blur-[2px] animate-fade"
      onClick={closeCommand}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="mx-auto mt-[12vh] w-full max-w-lg overflow-hidden rounded-xl border border-line bg-panel shadow-overlay animate-pop"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-ink-soft" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
          />
          {isFetching && (
            <span className="shimmer h-4 w-10 shrink-0 rounded" aria-label="Searching" />
          )}
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-ink-soft">
              {locale === "ar" ? "لا توجد نتائج" : "No results found."}
            </p>
          ) : (
            items.map((item, i) => {
              const Icon = item.icon;
              const isActive = i === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runItem(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors",
                    isActive
                      ? "bg-primary-50 font-medium text-primary-700"
                      : "text-ink hover:bg-rail"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-600" : "text-ink-soft")}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.hint && (
                    <span className="ms-auto shrink-0 rounded-full bg-rail px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                      {item.hint}
                    </span>
                  )}
                  {isActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-line bg-rail px-1.5 py-0.5">↑↓</kbd>
            {locale === "ar" ? "للتنقل" : "navigate"}
            <kbd className="ms-1 rounded border border-line bg-rail px-1.5 py-0.5">↵</kbd>
            {locale === "ar" ? "للفتح" : "open"}
          </span>
          <kbd className="rounded border border-line bg-rail px-1.5 py-0.5">esc</kbd>
        </div>
      </div>
    </div>
  );
}
