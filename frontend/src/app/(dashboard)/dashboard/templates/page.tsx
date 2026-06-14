"use client";

import { useSearchParams } from "next/navigation";
import { useStores } from "@/api/queries";
import { TemplateBrowser } from "@/features/templates/template-browser";

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const storeIdFromParams = searchParams.get("storeId") || undefined;
  const { data: stores } = useStores();
  const storeId = storeIdFromParams || stores?.[0]?.id;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Templates</h1>
      <TemplateBrowser storeId={storeId} />
    </div>
  );
}
