import { cn } from "@/lib/utils";

/**
 * The qamariya: the semicircular fanlight of a Sana'a window, stained
 * glass in radial wedges divided by gypsum-white mullions. Colors consume
 * the token vars, so dark mode turns it into the glowing night-window.
 *
 * Use it sparingly — empty states, auth panels, onboarding moments.
 * It is the brand's signature image; wallpaper kills it.
 */
export function Qamariya({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={cn("h-16 w-12", className)} aria-hidden="true">
      {/* Fanlight glass: five radial wedges — cobalt, amber, green, amber, cobalt */}
      <path d="M24 32L4 32a20 20 0 0 1 3.82-11.76Z" fill="var(--color-info)" opacity="0.85" />
      <path d="M24 32L7.82 20.24a20 20 0 0 1 10-7.26Z" fill="var(--color-accent-400)" opacity="0.85" />
      <path d="M24 32L17.82 12.98a20 20 0 0 1 12.36 0Z" fill="var(--color-success)" opacity="0.85" />
      <path d="M24 32L30.18 12.98a20 20 0 0 1 10 7.26Z" fill="var(--color-accent-400)" opacity="0.85" />
      <path d="M24 32l16.18-11.76A20 20 0 0 1 44 32Z" fill="var(--color-info)" opacity="0.85" />

      {/* Lower sash: two panes split by the center mullion */}
      <path d="M8 36h15v20H8z" fill="var(--color-success)" opacity="0.55" />
      <path d="M25 36h15v20H25z" fill="var(--color-info)" opacity="0.55" />

      {/* Gypsum (nurah) frame and mullions */}
      <path
        d="M5 60V32a19 19 0 0 1 38 0v28"
        stroke="var(--color-canvas)"
        strokeWidth="2.6"
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M5 60h38" stroke="var(--color-canvas)" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M5 32h38" stroke="var(--color-canvas)" strokeWidth="2" />
      <path
        d="M24 32V13M24 32L9.7 17.7M24 32l14.3-14.3M24 32v28"
        stroke="var(--color-canvas)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
