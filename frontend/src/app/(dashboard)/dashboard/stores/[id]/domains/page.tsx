"use client";

import { useParams } from "next/navigation";
import { StoreDomains } from "@/features/store/store-domains";

export default function StoreDomainsPage() {
  const params = useParams();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Domain Management</h1>
      <StoreDomains storeId={params.id as string} />
    </div>
  );
}
