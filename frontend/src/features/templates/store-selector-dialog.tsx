"use client";

import { useState } from "react";
import { useStores } from "@/api/queries";
import type { Store } from "@/shared/types";
import { AlertTriangle, Check, Store as StoreIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (storeId: string) => void;
  title: string;
  description?: string;
  currentThemeName?: string;
  currentTemplateName?: string;
  isLoading?: boolean;
}

export function StoreSelectorDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  currentThemeName,
  currentTemplateName,
  isLoading,
}: StoreSelectorDialogProps) {
  const { data: stores, isLoading: loadingStores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  if (!open) return null;

  const storeList = stores || [];
  const selectedStore = storeList.find((s: Store) => s.id === selectedStoreId);

  const handleConfirm = () => {
    if (selectedStoreId) {
      onConfirm(selectedStoreId);
      setSelectedStoreId(null);
    }
  };

  const handleClose = () => {
    setSelectedStoreId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
          </div>
          <button onClick={handleClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Store list */}
        <div className="max-h-80 overflow-y-auto px-6 py-4">
          {loadingStores ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : storeList.length === 0 ? (
            <div className="py-8 text-center">
              <StoreIcon className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No stores found. Create a store first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {storeList.map((store: Store) => {
                const isSelected = selectedStoreId === store.id;
                const hasTheme = !!currentThemeName && !!store.theme;
                const hasTemplate = !!currentTemplateName && !!store.template;

                return (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStoreId(store.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all",
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {/* Radio */}
                    <div
                      className={cn(
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
                        isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* Store info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{store.name}</span>
                        {store.domain && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                            {store.domain}
                          </span>
                        )}
                      </div>

                      {/* Replace warnings */}
                      {hasTheme && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          Currently using theme &ldquo;{currentThemeName}&rdquo; — will be replaced
                        </div>
                      )}
                      {hasTemplate && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          Currently using template &ldquo;{currentTemplateName}&rdquo; — will be replaced
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStoreId || isLoading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Installing..." : selectedStore ? `Install to ${selectedStore.name}` : "Install"}
          </button>
        </div>
      </div>
    </div>
  );
}
