"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: "start" | "end";
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Side drawer for mobile nav and filters. The small slide offset works
 * from either edge in both LTR and RTL.
 */
export function Sheet({ open, onClose, side = "start", title, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50 animate-fade" onClick={onClose} />
      <div
        className={cn(
          "absolute inset-y-0 z-10 flex w-80 max-w-[85vw] flex-col border-line bg-panel shadow-overlay",
          side === "start" ? "start-0 border-e animate-slide-start" : "end-0 border-s animate-slide-end",
          className
        )}
      >
        {title && (
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-rail hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
