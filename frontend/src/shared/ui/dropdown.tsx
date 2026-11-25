"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  /** The trigger element; a click toggles the menu. */
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  minWidth?: string;
  className?: string;
}

/**
 * Minimal menu primitive — replaces the ~8 hand-built
 * `absolute … border border-gray-200 bg-white py-1 shadow-lg` popovers.
 * Closes on outside click, Escape, and item click.
 */
export function Dropdown({ trigger, children, align = "end", minWidth = "min-w-44", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 rounded-lg border border-line bg-panel py-1 shadow-panel animate-pop",
            align === "end" ? "end-0" : "start-0",
            minWidth,
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

export function DropdownItem({ className, destructive, ...props }: DropdownItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-start text-sm transition-colors",
        destructive
          ? "text-error hover:bg-error-soft"
          : "text-ink-soft hover:bg-rail hover:text-ink",
        className
      )}
      {...props}
    />
  );
}
