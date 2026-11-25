"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { aiApi } from "@/api/ai";
import { Button, Spinner } from "@/shared/ui";

const BRIEF_PROMPT =
  "Give me a concise daily brief for my store as its owner: the most important priority today, one risk to watch, and one concrete action I should take. Keep it under 80 words, plain sentences, no headings.";

/**
 * The dashboard's AI daily brief. Explicit "Generate" only — never auto-fires,
 * so merchant AI credits are spent on purpose, not on page loads.
 */
export function AIBriefCard() {
  const t = useTranslations("dashboard.page.aiBrief");
  const locale = useLocale();
  const [brief, setBrief] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const conversation = await aiApi.createConversation({ title: "Daily brief" });
      const { content } = await aiApi.sendMessage(conversation.id, BRIEF_PROMPT);
      setBrief(content);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent-200 bg-panel p-4 shadow-sm animate-rise">
      <div className="khatam-bg pointer-events-none absolute end-0 top-0 h-36 w-36 opacity-70 [mask-image:linear-gradient(to_bottom_left,black,transparent_72%)]" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-strong">
              {t("tag")}
            </span>
            <h2 className="text-sm font-bold text-ink">{t("title")}</h2>
          </div>
          {!brief && (
            <Button
              size="sm"
              variant="outline"
              onClick={generate}
              disabled={loading}
              className="border-accent-200 text-accent-strong hover:bg-accent-soft"
            >
              {loading ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="whitespace-nowrap">{loading ? t("generating") : t("generate")}</span>
            </Button>
          )}
        </div>

        <div className="mt-3">
          {loading && !brief && (
            <div className="space-y-2">
              <div className="shimmer h-4 w-11/12 rounded" />
              <div className="shimmer h-4 w-3/4 rounded" />
            </div>
          )}
          {brief && <p className="text-sm leading-relaxed text-ink-soft">{brief}</p>}
          {failed && (
            <div className="rounded-lg bg-error-soft p-3 text-sm text-error">
              {t("error")}{" "}
              <Link
                href={`/${locale}/dashboard/ai`}
                className="font-semibold underline underline-offset-2"
              >
                {t("goToSettings")}
              </Link>
            </div>
          )}
          {!brief && !loading && !failed && (
            <p className="text-sm text-ink-soft">{t("configure")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
