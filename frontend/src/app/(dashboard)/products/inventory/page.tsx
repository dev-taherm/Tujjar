"use client";

import { InventoryManager } from "@/features/products/inventory-manager";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">Monitor stock levels and adjust inventory.</p>
      </div>
      <InventoryManager />
    </div>
  );
}
