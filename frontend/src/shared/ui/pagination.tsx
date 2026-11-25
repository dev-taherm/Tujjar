"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}

function pageWindow(page: number, pageCount: number): Array<number | "…"> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages: Array<number | "…"> = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pageCount - 1, page + 1);
  if (from > 2) pages.push("…");
  for (let p = from; p <= to; p++) pages.push(p);
  if (to < pageCount - 1) pages.push("…");
  pages.push(pageCount);
  return pages;
}

/**
 * Numbered pagination with logical-direction arrows (RTL-safe).
 */
export function Pagination({ page, pageCount, onChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  const btn =
    "flex h-8 min-w-8 items-center justify-center rounded-lg border border-line bg-panel px-2 text-sm font-medium text-ink-soft transition-colors hover:bg-rail hover:text-ink active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1.5", className)}>
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
      </button>
      {pageWindow(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-ink-soft">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={cn(
              btn,
              p === page && "border-primary-600 bg-primary-50 font-semibold text-primary-600 hover:bg-primary-50 hover:text-primary-600"
            )}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className={btn} disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
      </button>
    </nav>
  );
}
