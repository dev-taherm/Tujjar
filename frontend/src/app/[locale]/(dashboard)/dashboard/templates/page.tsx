"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStores } from "@/api/queries";
import { useTranslations } from "next-intl";
import { TemplateBrowser } from "@/features/templates/template-browser";
import { TemplateList } from "@/features/templates/template-list";
import { TemplateCreateDialog } from "@/features/templates/template-create-dialog";
import { Store, Plus } from "lucide-react";

export default function TemplatesPage() {
  const t = useTranslations("dashboard.templates");
  const searchParams = useSearchParams();
  const storeIdFromParams = searchParams.get("storeId") || undefined;
  const { data: stores, isLoading: loadingStores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(
    storeIdFromParams
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const storeId = selectedStoreId || stores?.[0]?.id;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t("templateManager")}</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {t("createTemplate")}
          </button>

          {/* Store selector */}
          {stores && stores.length > 0 && (
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-gray-400" />
              <select
                value={storeId || ""}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* My Templates */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">My Templates</h2>
        <TemplateList />
      </section>

      {/* Marketplace */}
      {loadingStores ? (
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      ) : (
        <TemplateBrowser storeId={storeId} />
      )}

      {/* Create Dialog */}
      <TemplateCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
