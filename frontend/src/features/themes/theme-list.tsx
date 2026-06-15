"use client";

import Link from "next/link";
import { useThemes } from "@/api/queries";
import { ThemeCard } from "./theme-card";
import { Palette, ExternalLink } from "lucide-react";
import { Button, EmptyState } from "@/shared/ui";
import { useTranslations, useLocale } from "next-intl";

export function ThemeList() {
  const t = useTranslations("dashboard.themes");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { data: themes, isLoading } = useThemes();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  const installedThemes = themes?.filter((t) => !t.is_system) ?? [];

  return (
    <div>
      {!installedThemes.length ? (
        <EmptyState
          icon={Palette}
          title={t("noThemesInstalled")}
          description={t("browseMarketplaceToInstall")}
          action={<Link href={`/${locale}/dashboard/marketplace`}><Button><ExternalLink className="me-2 h-4 w-4" />{t("browseMarketplace")}</Button></Link>}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {installedThemes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
}
