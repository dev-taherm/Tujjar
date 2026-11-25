"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Optional count chip (e.g. pending invitations) in warning amber. */
  badge?: number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  variant?: "underline" | "segmented";
  className?: string;
}

/**
 * One tab component for the whole app — kills the per-page underline-tab
 * reimplementations (store settings, themes, marketplace, inspector).
 */
export function Tabs({ tabs, active, onChange, variant = "underline", className }: TabsProps) {
  const badgeChip = (badge: number) => (
    <span className="ms-1.5 rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-bold text-warning tabular-nums">
      {badge}
    </span>
  );

  if (variant === "segmented") {
    return (
      <div className={cn("flex rounded-lg border border-line bg-rail p-0.5", className)} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors active:scale-[0.98]",
                isActive ? "bg-panel text-ink shadow-sm" : "text-ink-soft hover:text-ink"
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
              {tab.badge ? badgeChip(tab.badge) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 border-b border-line", className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-ink-soft hover:text-ink"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
            {tab.badge ? badgeChip(tab.badge) : null}
          </button>
        );
      })}
    </div>
  );
}
