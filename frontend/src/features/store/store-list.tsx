"use client";

import { useState } from "react";
import { Button } from "@/shared/ui";
import { useStores } from "@/api/queries";
import { StoreCard } from "./store-card";
import { StoreCreateDialog } from "./store-create-dialog";
import { Plus, Store } from "lucide-react";

export function StoreList() {
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
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16">
        <Store className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">No stores yet</h3>
        <p className="mb-6 text-sm text-gray-500">Create your first store to get started.</p>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="me-2 h-4 w-4" />
          Create Store
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your Stores</h2>
          <p className="text-sm text-gray-500">{stores.length} store{stores.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="me-2 h-4 w-4" />
          Create Store
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
