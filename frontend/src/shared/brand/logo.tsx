import { cn } from "@/lib/utils";

/**
 * Tujjar brand mark: an arched tower-house window of Old Sana'a with its
 * qamariya fanlight — the arch outline, the horizontal chord, and radial
 * mullions fanning above it. Stroke-based so it inherits `currentColor`;
 * text-primary-500 gives mudbrick sienna in light mode and the glowing
 * amber-lit sienna in dark mode.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
    >
      {/* Arched window frame with base */}
      <path
        d="M7 26V16a9 9 0 0 1 18 0v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7 26h18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Chord: where the fanlight begins */}
      <path d="M7 16h18" stroke="currentColor" strokeWidth="1.2" />
      {/* Radial mullions fanning through the fanlight */}
      <path
        d="M16 16V7M16 16L9.6 9.6M16 16l6.4-6.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Center mullion of the lower sash */}
      <path d="M16 16v10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Full lockup: mark + bilingual wordmark. Bilingual by design — the brand
 * speaks both scripts everywhere it appears.
 */
export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-7 w-7 text-primary-500" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-tight text-ink">Tujjar</span>
          <span className="font-display-arabic text-[11px] text-ink-soft">تجّار</span>
        </span>
      )}
    </span>
  );
}
