import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom";

/**
 * CSS-only tooltip (hover + keyboard focus), no portal, no state.
 */
export function Tooltip({
  label,
  children,
  side = "top",
  className,
}: {
  label: string;
  children: ReactNode;
  side?: Side;
  className?: string;
}) {
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-panel px-2 py-1 text-xs text-ink opacity-0 shadow-sm transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        )}
      >
        {label}
      </span>
    </span>
  );
}
