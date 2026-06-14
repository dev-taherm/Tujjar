"use client";

import { useParams } from "next/navigation";
import { StoreDomains } from "@/features/store/store-domains";
import { useTranslations } from "next-intl";

export default function StoreDomainsPage() {
  const t = useTranslations("dashboard.domains");
  const params = useParams();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("title")}</h1>
      <StoreDomains storeId={params.id as string} />
    </div>
  );
}
