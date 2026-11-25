"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles, PenTool, Languages, Server, Check, ArrowRight } from "lucide-react";
import { Button, SegmentedControl } from "@/shared/ui";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { BrandLogo } from "@/shared/brand/logo";
import { Qamariya } from "@/shared/brand/qamariya";
import { cn } from "@/lib/utils";

/**
 * The marketing landing — Tujjar's public face in the Old Sana'a language:
 * Fraunces/Reem Kufi display type, one signature gradient (the mudbrick
 * wall), qamariya windows, and a live bilingual demo of the platform's
 * two-script data model.
 */
export function LandingPage() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [demoLang, setDemoLang] = useState<"en" | "ar">(locale === "ar" ? "ar" : "en");

  const demoTitle = demoLang === "ar" ? t("bilingualDemo.productTitleAr") : t("bilingualDemo.productTitle");
  const demoBody = demoLang === "ar" ? t("bilingualDemo.productBodyAr") : t("bilingualDemo.productBody");

  return (
    <div className="scroll-smooth bg-canvas text-ink">
      {/* ============ Nav ============ */}
      <header className="sticky top-0 z-30 border-b border-line bg-panel/85 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
          <Link href={`/${locale}`} aria-label="Tujjar">
            <BrandLogo />
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
            <a href="#features" className="transition-colors hover:text-ink">{t("nav.features")}</a>
            <a href="#themes" className="transition-colors hover:text-ink">{t("nav.themes")}</a>
            <a href="#pricing" className="transition-colors hover:text-ink">{t("nav.pricing")}</a>
            <a
              href="https://github.com/dev-taherm/Tujjar"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink"
            >
              {t("nav.github")}
            </a>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher variant="header" />
            <Link href={`/${locale}/register`}>
              <Button size="sm" className="hidden sm:inline-flex">{t("getStarted")}</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden">
        <div className="khatam-bg absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 md:pt-24">
          <div className="mx-auto max-w-3xl text-center animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-700">
              {t("hero.eyebrow")}
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              {t("hero.headline")}
              <br />
              <span className="text-primary-600">{t("hero.headlineAccent")}</span>
            </h1>
            <p className="mt-4 font-display-arabic text-xl text-primary-700" dir="rtl">
              تجّار — سوقك بين يديك
            </p>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
              {t("hero.sub")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={`/${locale}/register`}>
                <Button size="lg" className="px-8 shadow-panel">{t("hero.primaryCta")}</Button>
              </Link>
              <a href="#themes">
                <Button size="lg" variant="outline" className="px-8">{t("hero.secondaryCta")}</Button>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs font-medium text-ink-soft">
              <span>{t("hero.meta1")}</span>
              <i className="h-1 w-1 rounded-full bg-primary-300" />
              <span>{t("hero.meta2")}</span>
              <i className="h-1 w-1 rounded-full bg-primary-300" />
              <span>{t("hero.meta3")}</span>
              <i className="h-1 w-1 rounded-full bg-primary-300" />
              <span>{t("hero.meta4")}</span>
            </div>
          </div>

          {/* The mudbrick wall with its qamariya windows — the one
              signature gradient on this page. */}
          <div className="relative mt-16 h-56 md:h-64">
            <div className="gradient-qamariya absolute inset-x-0 bottom-0 h-44 rounded-t-full md:h-48">
              <div className="absolute left-[7%] right-[7%] top-6 h-[3px] rounded-full bg-[#F9F5EC]/90" />
              <div className="absolute left-[7%] right-[7%] top-11 h-[2px] rounded-full bg-[#F9F5EC]/45" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-6 md:gap-10">
              <Qamariya className="h-36 w-27 opacity-95 md:h-44 md:w-[132px]" />
              <Qamariya className="-mb-1 h-44 w-33 md:h-56 md:w-[168px]" />
              <Qamariya className="h-36 w-27 opacity-95 md:h-44 md:w-[132px]" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ Bilingual demo ============ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-rise">
            <h2 className="font-display text-3xl font-semibold tracking-tight">{t("bilingualDemo.title")}</h2>
            <p className="mt-3 max-w-md leading-relaxed text-ink-soft">{t("bilingualDemo.description")}</p>
            <div className="mt-6">
              <SegmentedControl
                options={[
                  { value: "en", label: t("bilingualDemo.labels.en") },
                  { value: "ar", label: t("bilingualDemo.labels.ar") },
                ]}
                value={demoLang}
                onChange={(v) => setDemoLang(v)}
              />
            </div>
          </div>

          <div key={demoLang} className="animate-rise rounded-xl border border-line bg-panel p-5 shadow-panel">
            <div className="flex items-start gap-5">
              <div className="khatam-bg arch flex h-36 w-28 shrink-0 items-center justify-center bg-primary-50">
                <Qamariya className="h-20 w-15" />
              </div>
              <div dir={demoLang === "ar" ? "rtl" : "ltr"} className="min-w-0 text-start">
                <h3 className="text-lg font-bold leading-snug">{demoTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{demoBody}</p>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-primary-700">
                  $24.00
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-strong">
                    AI-drafted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Features ============ */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {t("features.title")}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sparkles, title: t("features.ai.title"), desc: t("features.ai.desc"), tone: "bg-accent-soft text-accent-strong" },
            { icon: PenTool, title: t("features.builder.title"), desc: t("features.builder.desc"), tone: "bg-primary-50 text-primary-600" },
            { icon: Languages, title: t("features.bilingual.title"), desc: t("features.bilingual.desc"), tone: "bg-info-soft text-info" },
            { icon: Server, title: t("features.selfHosted.title"), desc: t("features.selfHosted.desc"), tone: "bg-success-soft text-success" },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-line bg-panel p-5 shadow-sm transition-shadow hover:shadow-panel"
            >
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", f.tone)}>
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Themes ============ */}
      <section id="themes" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("themes.title")}
          </h2>
          <Link
            href={`/${locale}/dashboard/marketplace`}
            className="text-sm font-bold text-primary-700 transition-colors hover:text-primary-600"
          >
            {t("themes.browseAll")}
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              name: t("themes.sanaa.name"),
              sub: t("themes.sanaa.sub"),
              banner: "linear-gradient(120deg,#F0DCC8,#BC7B4C 55%,#96522E)",
              dots: ["#96522E", "#D69229", "#F9F5EC"],
            },
            {
              name: t("themes.samsarah.name"),
              sub: t("themes.samsarah.sub"),
              banner: "linear-gradient(120deg,#DCE7EE,#2D5F8C 55%,#173F5E)",
              dots: ["#2D5F8C", "#3E7050", "#DCE7EE"],
            },
            {
              name: t("themes.qamariya.name"),
              sub: t("themes.qamariya.sub"),
              banner: "linear-gradient(120deg,#F8E7C4,#DFA23E 55%,#B2761D)",
              dots: ["#DFA23E", "#B2761D", "#F8E7C4"],
            },
          ].map((theme) => (
            <div key={theme.name} className="overflow-hidden rounded-xl border border-line bg-panel shadow-sm transition-shadow hover:shadow-panel">
              <div className="relative h-28" style={{ background: theme.banner }}>
                <div className="khatam-bg absolute inset-0 opacity-30" />
                <div className="absolute bottom-0 start-4 flex translate-y-1/2">
                  {theme.dots.map((d) => (
                    <span
                      key={d}
                      className="h-5 w-5 rounded-full border-[2.5px] border-[#F9F5EC] shadow"
                      style={{ background: d, marginInlineEnd: "-5px" }}
                    />
                  ))}
                </div>
              </div>
              <div className="p-4 pt-6">
                <h3 className="text-base font-bold">{theme.name}</h3>
                <p className="mt-0.5 text-sm text-ink-soft">{theme.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Pricing ============ */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("pricing.title")}
          </h2>
          <p className="mt-3 text-ink-soft">{t("pricing.sub")}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              name: t("pricing.starter.name"),
              price: t("pricing.starter.price"),
              desc: t("pricing.starter.desc"),
              features: [t("pricing.starter.f1"), t("pricing.starter.f2"), t("pricing.starter.f3")],
              cta: t("pricing.starter.cta"),
              highlight: false,
            },
            {
              name: t("pricing.growth.name"),
              price: t("pricing.growth.price"),
              desc: t("pricing.growth.desc"),
              features: [t("pricing.growth.f1"), t("pricing.growth.f2"), t("pricing.growth.f3")],
              cta: t("pricing.growth.cta"),
              badge: t("pricing.growth.badge"),
              highlight: true,
            },
            {
              name: t("pricing.scale.name"),
              price: t("pricing.scale.price"),
              desc: t("pricing.scale.desc"),
              features: [t("pricing.scale.f1"), t("pricing.scale.f2"), t("pricing.scale.f3")],
              cta: t("pricing.scale.cta"),
              highlight: false,
            },
          ].map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative rounded-xl border bg-panel p-6",
                tier.highlight
                  ? "border-accent-300 shadow-panel"
                  : "border-line shadow-sm"
              )}
            >
              {tier.badge && (
                <span className="gradient-qamariya absolute -top-3 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold text-[#F9F5EC] shadow">
                  {tier.badge}
                </span>
              )}
              <h3 className="text-base font-bold">{tier.name}</h3>
              <p className="mt-1 text-sm text-ink-soft">{tier.desc}</p>
              <p className="mt-4 font-display text-4xl font-semibold">
                {tier.price}
                {tier.price !== t("pricing.starter.price") && (
                  <span className="text-sm font-normal text-ink-soft">{t("pricing.monthly")}</span>
                )}
              </p>
              <ul className="mt-5 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/register`}>
                <Button className="mt-6 w-full" variant={tier.highlight ? "default" : "outline"}>
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CTA band ============ */}
      <section className="relative overflow-hidden">
        <div className="gradient-qamariya relative">
          <div className="absolute left-[7%] right-[7%] top-5 h-[3px] rounded-full bg-[#F9F5EC]/90" />
          <div className="khatam-bg absolute inset-0 opacity-30" />
          <div className="absolute inset-0 bg-[#241E15]/45" />
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center text-[#F9F5EC]">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">{t("cta.title")}</h2>
            <p className="mt-3 text-[#F9F5EC]/80">{t("cta.sub")}</p>
            <Link href={`/${locale}/register`} className="mt-8 inline-block">
              <span className="inline-flex items-center gap-2 rounded-xl bg-[#F9F5EC] px-8 py-3.5 text-sm font-bold text-[#412114] shadow-panel transition-transform hover:scale-[1.02] active:scale-[0.98]">
                {t("cta.button")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="border-t border-line bg-panel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <BrandLogo />
          <div className="flex items-center gap-5 text-sm text-ink-soft">
            <a href="#features" className="transition-colors hover:text-ink">{t("nav.features")}</a>
            <a href="#themes" className="transition-colors hover:text-ink">{t("nav.themes")}</a>
            <a href="#pricing" className="transition-colors hover:text-ink">{t("nav.pricing")}</a>
            <a
              href="https://github.com/dev-taherm/Tujjar"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink"
            >
              {t("nav.github")}
            </a>
          </div>
          <p className="text-sm text-ink-soft">
            © {new Date().getFullYear()} Tujjar · {t("footer.license")} · {t("footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}
