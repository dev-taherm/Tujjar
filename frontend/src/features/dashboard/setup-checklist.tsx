"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Check, ArrowRight } from "lucide-react";
import { useStores, useProducts, useSubscription } from "@/api/queries";

/**
 * First-run setup checklist, derived from live data. Renders nothing once
 * every step is complete.
 */
export function SetupChecklist() {
  const t = useTranslations("dashboard.page.setup");
  const locale = useLocale();
  const { data: stores } = useStores();
  const { data: products } = useProducts({});
  const { data: subscription } = useSubscription();

  const billingDone =
    !!subscription &&
    (subscription.status === "active" || subscription.status === "trialing");

  const checks = [
    {
      label: t("storeCreated"),
      done: (stores?.length ?? 0) > 0,
      href: `/${locale}/dashboard/onboarding`,
    },
    {
      label: t("firstProduct"),
      done: (products?.length ?? 0) > 0,
      href: `/${locale}/dashboard/products`,
    },
    {
      label: t("connectBilling"),
      done: billingDone,
      href: `/${locale}/dashboard/billing`,
    },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  if (doneCount === checks.length) return null;

  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-sm animate-rise">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">{t("title")}</h2>
        <span className="text-xs font-medium text-ink-soft tabular-nums">
          {doneCount}/{checks.length}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-rail">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400 transition-all duration-500"
          style={{ width: `${(doneCount / checks.length) * 100}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2.5">
        {checks.map((check) =>
          check.done ? (
            <li key={check.label} className="flex items-center gap-2.5 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-ink">{check.label}</span>
            </li>
          ) : (
            <li key={check.label}>
              <Link href={check.href} className="group flex items-center gap-2.5 text-sm">
                <span className="h-5 w-5 rounded-full border border-line bg-rail transition-colors group-hover:border-primary-300" />
                <span className="text-ink-soft underline-offset-4 transition-colors group-hover:text-primary-700 group-hover:underline">
                  {check.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-ink-soft transition-all rtl:rotate-180 group-hover:translate-x-0.5 group-hover:text-primary-600" />
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
