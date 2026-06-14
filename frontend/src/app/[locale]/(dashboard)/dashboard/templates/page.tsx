"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStores } from "@/api/queries";
import { TemplateBrowser } from "@/features/templates/template-browser";
import { Store } from "lucide-react";

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const storeIdFromParams = searchParams.get("storeId") || undefined;
  const { data: stores, isLoading: loadingStores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(
    storeIdFromParams
  );

  const storeId = selectedStoreId || stores?.[0]?.id;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Templates</h1>

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
    </div>
  );
}
