"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui";

/**
 * Stripe checkout return page. The payment may still be processing — the
 * webhook confirms it server-side; this page thanks the shopper and keeps
 * the session id out of shareable URLs.
 */
export default function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations("storefront.checkout");
  const sessionRef = searchParams.get("order");

  useEffect(() => {
    if (sessionRef) {
      // The {CHECKOUT_SESSION_ID} template filled the URL; strip it so the
      // address stays clean when shared.
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [sessionRef]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <CheckCircle2
        className="mx-auto h-16 w-16"
        style={{ color: "var(--color-success, #16a34a)" }}
      />
      <h1 className="mt-6 text-3xl font-bold" style={{ color: "var(--color-text)" }}>
        {t("thankYou")}
      </h1>
      <p
        className="mt-3 flex items-center justify-center gap-2 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("paymentProcessing")}
      </p>
      <Link href={`/${locale}/shop/${slug}`} className="mt-8 inline-block">
        <Button size="lg">{t("continueShopping")}</Button>
      </Link>
    </div>
  );
}
