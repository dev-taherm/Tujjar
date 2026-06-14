"use client";

import { StoreList } from "@/features/store/store-list";

export default function StoresPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Stores</h1>
      <StoreList />
    </div>
  );
}
