"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/shared/brand/logo";
import { Qamariya } from "@/shared/brand/qamariya";

/*
 * Merchant-lore quotes that rotate on the brand panel. Bilingual by data,
 * not by translation layer — each quote is authored in both scripts.
 */
const QUOTES = [
  {
    en: "The souk remembers the merchant who keeps his word.",
    ar: "السوق يذكر التاجر الذي يحفظ وعده.",
  },
  {
    en: "Every great bazaar began with a single stall.",
    ar: "كل سوقٍ عظيم بدأ ببسطةٍ صغيرة.",
  },
  {
    en: "Trade is the oldest form of trust.",
    ar: "التجارة أقدم صور الثقة.",
  },
];
const QUOTE_SOURCE = { en: "— a merchant of Old Sana'a", ar: "— تاجر من صنعاء القديمة" };

/**
 * The auth split-screen: a qamariya-lit brand panel beside the form.
 * On mobile the panel collapses into a compact gradient band.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setQuoteIndex((i) => (i + 1) % QUOTES.length), 7000);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[quoteIndex];
  const scrim = "absolute inset-0 bg-[#241E15]/55";

  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[1.15fr_1fr]">
      {/* Brand panel (desktop) */}
      <aside className="gradient-qamariya relative hidden flex-col justify-between overflow-hidden p-10 text-[#F9F5EC] lg:flex">
        <div className="khatam-bg absolute inset-0 opacity-40" />
        <div className={scrim} />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9 text-[#F9F5EC]" />
            <span className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight">Tujjar</span>
              <span className="font-display-arabic text-xs text-[#F9F5EC]/80">تجّار</span>
            </span>
          </div>

          <h1 className="mt-20 max-w-md font-display text-4xl font-semibold leading-[1.08] xl:text-5xl">
            Your souk,
            <br />
            yours to run.
          </h1>
          <p className="mt-4 font-display-arabic text-xl text-[#F9F5EC]/90" dir="rtl">
            تجّار — سوقك بين يديك
          </p>
        </div>

        <div className="relative">
          <blockquote key={quoteIndex} className="max-w-md">
            <p className="animate-rise inline-block text-lg leading-relaxed text-[#F9F5EC]/95">
              “{locale === "ar" ? quote.ar : quote.en}”
            </p>
            <footer className="mt-2 text-sm text-[#F9F5EC]/70">
              {locale === "ar" ? QUOTE_SOURCE.ar : QUOTE_SOURCE.en}
            </footer>
          </blockquote>

          <div className="mt-8 flex items-end justify-between gap-6">
            <div className="flex gap-1.5">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuoteIndex(i)}
                  aria-label={`${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === quoteIndex ? "w-6 bg-[#F9F5EC]" : "w-2 bg-[#F9F5EC]/40 hover:bg-[#F9F5EC]/60"
                  )}
                />
              ))}
            </div>
            <Qamariya className="h-28 w-[84px] opacity-95" />
          </div>
        </div>
      </aside>

      {/* Mobile brand band */}
      <div className="gradient-qamariya relative px-6 py-5 text-[#F9F5EC] lg:hidden">
        <div className="khatam-bg absolute inset-0 opacity-30" />
        <div className={scrim} />
        <div className="relative flex items-center gap-2.5">
          <LogoMark className="h-7 w-7 text-[#F9F5EC]" />
          <span className="text-lg font-bold">Tujjar</span>
          <span className="font-display-arabic text-sm text-[#F9F5EC]/85">تجّار</span>
          <span className="ms-auto truncate font-display text-xs text-[#F9F5EC]/85 sm:text-sm">
            Connect — Operate — Grow
          </span>
        </div>
      </div>

      {/* Form column */}
      <div className="flex items-center justify-center p-6 py-12 lg:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
