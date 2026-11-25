import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumbs for deep routes (products/[id], orders/[id], stores/[id]…).
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-sm", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-soft/60 rtl:rotate-180" />}
            {isLast || !item.href ? (
              <span className={cn("truncate", isLast ? "font-medium text-ink" : "text-ink-soft")}>
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="truncate text-ink-soft transition-colors hover:text-ink">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
