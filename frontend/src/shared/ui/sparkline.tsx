import { cn } from "@/lib/utils";

/**
 * Inline sparkline for stat cards. Consumes the primary token directly so
 * it adapts to dark mode (mudbrick sienna / glowing amber-lit sienna).
 */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = 74 / (data.length - 1);
  const points = data
    .map((v, i) => `${(1 + i * step).toFixed(1)},${(22 - ((v - min) / span) * 18).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 76 26"
      className={cn("h-6 w-[76px] shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        stroke="var(--color-primary-500)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
