"use client";

import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Segmented control (builder device switcher, range pickers, tabs).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("flex rounded-lg border border-line bg-rail p-0.5", className)} role="group">
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors active:scale-[0.98]",
              isActive ? "bg-panel text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
