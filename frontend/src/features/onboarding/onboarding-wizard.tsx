"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button, Input, Spinner } from "@/shared/ui";
import { Qamariya } from "@/shared/brand/qamariya";
import { useThemes } from "@/api/themes";
import { useCheckSlug, useCreateStoreWizard, useSetTheme } from "@/api/stores";
import { useCreateProduct } from "@/api/products";
import type { Theme } from "@/shared/types";
import { cn } from "@/lib/utils";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || `store-${Math.random().toString(36).slice(2, 6)}`;
}

type SlugState = "idle" | "checking" | "available" | "taken";

/**
 * The signature moment: a four-step wizard where the store assembles itself
 * in the live preview as the merchant types — name, palette, first product,
 * then the "open the souk" finale.
 */
export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [description, setDescription] = useState("");
  const [themeId, setThemeId] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);

  const { data: themes, isLoading: themesLoading } = useThemes();
  const checkSlug = useCheckSlug();
  const createStore = useCreateStoreWizard();
  const setTheme = useSetTheme();
  const createProduct = useCreateProduct();

  /* Keep the slug in sync with the name until the merchant edits it. */
  useEffect(() => {
    if (!slugTouched) setSlug(name ? slugify(name) : "");
  }, [name, slugTouched]);

  /* Live slug availability check (debounced). */
  useEffect(() => {
    if (slug.length < 2) {
      setSlugState("idle");
      return;
    }
    setSlugState("checking");
    const id = setTimeout(async () => {
      try {
        const result = await checkSlug.mutateAsync(slug);
        setSlugState(result.available ? "available" : "taken");
      } catch {
        setSlugState("idle");
      }
    }, 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const selectedTheme: Theme | undefined = useMemo(
    () => themes?.find((th) => th.id === themeId) ?? themes?.[0],
    [themes, themeId]
  );

  const canContinueBasics =
    name.trim().length >= 2 && slug.length >= 2 && slugState !== "taken" && slugState !== "checking";

  const launch = async () => {
    setCreating(true);
    try {
      const store = await createStore.mutateAsync({
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
      });
      if (selectedTheme) {
        try {
          await setTheme.mutateAsync({ storeId: store.id, themeId: selectedTheme.id });
        } catch {
          /* theme is cosmetic — don't fail the launch for it */
        }
      }
      if (productTitle.trim() && productPrice) {
        try {
          await createProduct.mutateAsync({
            store: store.id,
            title: productTitle.trim(),
            price: Number(productPrice),
            status: "active",
          });
        } catch {
          /* first product is optional — don't fail the launch */
        }
      }
      setDone(true);
    } catch {
      toast.error(
        locale === "ar" ? "تعذّر إنشاء المتجر — تحقق من العنوان وحاول مجددًا." : "Couldn't create the store — check the address and try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const stepLabels = [t("steps.basics"), t("steps.look"), t("steps.product"), t("steps.launch")];

  /* ============ Success finale ============ */
  if (done) {
    return (
      <div className="gradient-qamariya relative mx-auto max-w-xl overflow-hidden rounded-xl p-10 text-center text-[#F9F5EC] shadow-overlay animate-rise">
        <div className="khatam-bg absolute inset-0 opacity-30" />
        <div className="absolute inset-0 bg-[#241E15]/45" />
        <div className="relative">
          <div className="mx-auto mb-6 flex w-fit">
            <Qamariya className="h-28 w-[84px]" />
          </div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">{t("launch.successTitle")}</h1>
          <p className="mt-3 text-[#F9F5EC]/85">{t("launch.successDesc")}</p>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#F9F5EC] px-8 py-3 text-sm font-bold text-[#412114] shadow-panel transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("launch.goDashboard")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Heading + progress */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("subtitle")}</p>
        <div className="mt-6 flex items-center justify-center gap-2">
          {stepLabels.map((label, i) => (
            <button
              key={label}
              type="button"
              disabled={i > step}
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                i === step
                  ? "bg-primary-600 text-white shadow-sm"
                  : i < step
                    ? "bg-primary-50 text-primary-700 hover:bg-primary-100"
                    : "bg-rail text-ink-soft/70"
              )}
            >
              {i < step ? <Check className="h-3 w-3" /> : <span className="tabular-nums">{i + 1}</span>}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        {/* ============ Form column ============ */}
        <div className="rounded-xl border border-line bg-panel p-6 shadow-sm animate-rise">
          {step === 0 && (
            <div className="space-y-5">
              <Input
                label={t("basics.storeName")}
                placeholder={t("basics.storeNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label={t("basics.slug")}
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
              />
              <p
                className={cn(
                  "text-xs font-medium",
                  slugState === "taken" ? "text-error" : slugState === "available" ? "text-success" : "text-ink-soft"
                )}
              >
                {slugState === "checking" && t("basics.checking")}
                {slugState === "available" && `✓ ${t("basics.slugAvailable")}: ${slug}.{process.env.NEXT_PUBLIC_STORE_DOMAIN || "tujjar.shop"}`}
                {slugState === "taken" && `✗ ${t("basics.slugTaken")}`}
                {slugState === "idle" && `${slug}.${process.env.NEXT_PUBLIC_STORE_DOMAIN || "tujjar.shop"}`}
              </p>
              <Input
                label={t("basics.description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={() => setStep(1)} disabled={!canContinueBasics}>
                  {t("basics.next")}
                  <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold">{t("look.title")}</h2>
                <p className="mt-1 text-sm text-ink-soft">{t("look.desc")}</p>
              </div>
              {themesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="shimmer h-20 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(themes ?? []).slice(0, 8).map((theme) => {
                    const c = theme.config.colors;
                    const isSelected = (selectedTheme?.id ?? themes?.[0]?.id) === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setThemeId(theme.id)}
                        className={cn(
                          "overflow-hidden rounded-lg border text-start transition-all active:scale-[0.98]",
                          isSelected
                            ? "border-primary-600 ring-2 ring-primary-500/25"
                            : "border-line hover:border-primary-300"
                        )}
                      >
                        <div
                          className="h-12"
                          style={{
                            background: `linear-gradient(120deg, ${c.surface}, ${c.primary} 65%, ${c.accent})`,
                          }}
                        />
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className="text-xs font-bold">{theme.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  ←
                </Button>
                <Button onClick={() => setStep(2)}>
                  {t("look.next")}
                  <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold">{t("product.title")}</h2>
                <p className="mt-1 text-sm text-ink-soft">{t("product.desc")}</p>
              </div>
              <Input
                label={t("product.productTitle")}
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
              />
              <Input
                label={t("product.productPrice")}
                type="number"
                min="0"
                step="0.01"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
              />
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  ←
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    {t("product.skip")}
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!productTitle.trim() || !productPrice}>
                    {t("product.next")}
                    <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold">{t("launch.title")}</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {name || "—"} · {selectedTheme?.name ?? "—"}
                  {productTitle.trim() ? ` · ${productTitle.trim()}` : ""}
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  ←
                </Button>
                <Button size="lg" onClick={launch} disabled={creating} className="px-8">
                  {creating ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  {creating ? t("launch.creating") : t("launch.button")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ============ Live preview ============ */}
        <div className="lg:sticky lg:top-20">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {t("preview")}
          </p>
          <StorePreviewMock
            storeName={name}
            theme={selectedTheme}
            productTitle={productTitle}
            productPrice={productPrice ? `$${productPrice}` : ""}
          />
        </div>
      </div>
    </div>
  );
}

/* ============ The assembling storefront mock ============ */
function StorePreviewMock({
  storeName,
  theme,
  productTitle,
  productPrice,
}: {
  storeName: string;
  theme?: Theme;
  productTitle: string;
  productPrice: string;
}) {
  const c = theme?.config.colors;
  const primary = c?.primary || "#96522E";
  const bg = c?.background || "#F9F5EC";
  const surface = c?.surface || "#FFFFFF";
  const text = c?.text || "#26201A";
  const textSecondary = c?.textSecondary || "#6F6154";
  const border = c?.border || "#E3D9C6";

  return (
    <div
      className="overflow-hidden rounded-xl border border-line shadow-panel transition-colors duration-300 animate-rise"
      style={{ background: bg, color: text }}
      key={theme?.id ?? "default"}
    >
      <div
        className="px-4 py-3 text-xs font-bold"
        style={{ background: surface, borderBottom: `1px solid ${border}`, color: text }}
      >
        {storeName || "Your store"}
      </div>
      <div className="px-4 py-8 text-center" style={{ background: primary }}>
        <p className="font-display text-lg font-semibold text-white/95">Your souk, yours to run.</p>
        <p className="mt-1 font-display-arabic text-sm text-white/80" dir="rtl">
          سوقك بين يديك
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg p-2"
            style={{ background: surface, border: `1px solid ${border}` }}
          >
            <div
              className="mb-2 h-12 rounded-md"
              style={{ background: i === 0 && productTitle ? primary : `${textSecondary}22` }}
            />
            {i === 0 && productTitle ? (
              <>
                <p className="truncate text-[11px] font-bold" style={{ color: text }}>
                  {productTitle}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: primary }}>
                  {productPrice || "$0.00"}
                </p>
              </>
            ) : (
              <div className="space-y-1">
                <div className="h-2 rounded" style={{ background: `${textSecondary}33` }} />
                <div className="h-2 w-2/3 rounded" style={{ background: `${textSecondary}22` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
