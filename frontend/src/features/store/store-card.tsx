"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/shared/ui";
import { Store, Globe, ExternalLink, ArrowUpRight } from "lucide-react";
import type { Store as StoreType } from "@/shared/types";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface StoreCardProps {
  store: StoreType;
}

export function StoreCard({ store }: StoreCardProps) {
  const t = useTranslations("storeSettings");
  const tc = useTranslations("common");
  const locale = useLocale();
  return (
    <Link href={`/${locale}/dashboard/stores/${store.id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                <Store className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{store.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {store.domain}
                </CardDescription>
              </div>
            </div>
            <Badge variant={store.is_active ? "success" : "secondary"}>
              {store.is_active ? tc("active") : tc("inactive")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{store.description || t("noDescription")}</span>
            <div className="flex items-center gap-2">
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(`https://${store.domain}/`, "_blank", "noopener,noreferrer");
                }}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 opacity-0 transition-all hover:bg-gray-50 group-hover:opacity-100"
              >
                {t("visitStore")}
                <ArrowUpRight className="h-3 w-3" />
              </span>
              <ExternalLink className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
