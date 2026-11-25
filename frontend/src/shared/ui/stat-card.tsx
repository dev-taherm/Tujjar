import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

/**
 * KPI card with delta chip + sparkline, as specced for the dashboard home.
 */
interface StatCardProps {
  label: string;
  value: string | number;
  /** Percentage change; sign decides the delta chip tone. */
  delta?: number | null;
  deltaLabel?: string;
  icon?: LucideIcon;
  tone?: "primary" | "success" | "info" | "warning" | "error";
  spark?: number[];
  className?: string;
}

const toneChip: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary-50 text-primary-600",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
};

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  tone = "primary",
  spark,
  className,
}: StatCardProps) {
  const positive = (delta ?? 0) >= 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-panel p-4 shadow-sm transition-shadow hover:shadow-panel",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-ink-soft">{label}</p>
        {Icon && (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneChip[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        {delta != null ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-bold tabular-nums",
              positive ? "bg-success-soft text-success" : "bg-error-soft text-error"
            )}
            title={deltaLabel}
          >
            {positive ? "▲" : "▼"} {positive ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        ) : (
          <span />
        )}
        {spark && spark.length > 1 && <Sparkline data={spark} />}
      </div>
    </div>
  );
}
