"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Sort/search controls for the storefront product listing. State lives in
 * the URL (searchParams) so listings remain server-rendered and crawlable.
 */
export function ProductListControls({ sort }: { sort: string }) {
  const t = useTranslations("storefront.products");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(currentSearch);

  // Keep the input in sync when the URL changes (back/forward navigation)
  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = (nextSearch: string, nextSort: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString());
      if (nextSearch) sp.set("search", nextSearch);
      else sp.delete("search");
      if (nextSort && nextSort !== "-created_at") sp.set("sort", nextSort);
      else sp.delete("sort");
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 350);
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          updateParams(e.target.value, sort);
        }}
        placeholder={t("searchPlaceholder")}
        className="rounded-lg border px-3 py-1.5 text-sm"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
      />
      <select
        value={sort}
        onChange={(e) => updateParams(search, e.target.value)}
        className="rounded-lg border px-3 py-1.5 text-sm"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
      >
        <option value="-created_at">{t("sortNewest")}</option>
        <option value="name">{t("sortNameAZ")}</option>
        <option value="-name">{t("sortNameZA")}</option>
        <option value="price">{t("sortPriceLowHigh")}</option>
        <option value="-price">{t("sortPriceHighLow")}</option>
      </select>
    </div>
  );
}
