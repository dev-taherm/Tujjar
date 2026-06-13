"use client";

import { useSearchParams } from "next/navigation";
import { TemplateBrowser } from "@/features/templates/template-browser";

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") || undefined;

  return (
    <div className="p-6">
      <TemplateBrowser storeId={storeId} />
    </div>
  );
}
