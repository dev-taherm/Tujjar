"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/api/queries";
import { StoreSettingsForm } from "@/features/store/store-settings-form";
import { Skeleton } from "@/shared/ui";
import { useTranslations } from "next-intl";

export default function StoreDetailPage() {
  const t = useTranslations("dashboard.page");
  const params = useParams();
  const { data: store, isLoading } = useStore(params.id as string);

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("storeSettings")}</h1>
        <div className="space-y-4">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!store) {
    return <div>{t("storeNotFound")}</div>;
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Store Settings</h1>
      <StoreSettingsForm store={store} />
    </div>
  );
}
