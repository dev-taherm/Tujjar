"use client";

import { useState } from "react";
import { Button, EmptyState } from "@/shared/ui";
import { useStores } from "@/api/queries";
import { StoreCard } from "./store-card";
import { StoreCreateDialog } from "./store-create-dialog";
import { Plus, Store } from "lucide-react";
import { useTranslations } from "next-intl";

export function StoreList() {
  const t = useTranslations("storeSettings");
  const tc = useTranslations("common");
  const { data: stores, isLoading } = useStores();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!stores?.length) {
    return (
      <EmptyState
        icon={Store}
        title={t("noStores")}
        description={t("createFirstStore")}
        action={<Button onClick={() => setShowCreate(true)}><Plus className="me-2 h-4 w-4" />{t("createStore")}</Button>}
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t("yourStores")}</h2>
          <p className="text-sm text-gray-500">{stores.length} {stores.length !== 1 ? t("storeCountPlural") : t("storeCount")}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t("createStore")}
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}
      </div>
      <StoreCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  );
}
