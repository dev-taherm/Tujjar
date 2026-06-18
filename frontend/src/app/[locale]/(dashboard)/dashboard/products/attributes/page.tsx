"use client";

import { useState } from "react";
import { useProducts } from "@/api/queries";
import {
  useGlobalOptions,
  useCreateGlobalOption,
  useDeleteGlobalOption,
  useAddGlobalOptionValue,
  useDeleteGlobalOptionValue,
} from "@/api/products";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export default function AttributesPage() {
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPosition, setNewOptionPosition] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [valueInputs, setValueInputs] = useState<Record<string, string>>({});
  const [swatchInputs, setSwatchInputs] = useState<Record<string, string>>({});

  const { data: options = [], isLoading } = useGlobalOptions();
  const { data: products = [] } = useProducts();
  const createOption = useCreateGlobalOption();
  const deleteOption = useDeleteGlobalOption();
  const addValue = useAddGlobalOptionValue();
  const deleteValue = useDeleteGlobalOptionValue();

  const handleCreateOption = async () => {
    if (!newOptionName.trim() || !selectedProductId) return;
    await createOption.mutateAsync({
      product: selectedProductId,
      name: newOptionName,
      position: newOptionPosition,
    });
    setNewOptionName("");
    setNewOptionPosition(0);
    toast.success("Option created");
  };

  const handleAddValue = async (optionId: string) => {
    const value = valueInputs[optionId];
    const swatch = swatchInputs[optionId];
    if (!value?.trim()) return;
    await addValue.mutateAsync({ optionId, value, swatch });
    setValueInputs((prev) => ({ ...prev, [optionId]: "" }));
    setSwatchInputs((prev) => ({ ...prev, [optionId]: "" }));
    toast.success("Value added");
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm("Delete this option and all its values?")) return;
    await deleteOption.mutateAsync(optionId);
    toast.success("Option deleted");
  };

  const handleDeleteValue = async (optionId: string, valueId: string) => {
    await deleteValue.mutateAsync({ optionId, valueId });
    toast.success("Value deleted");
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-200" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Attributes</h1>
        <p className="text-gray-600 mt-1">
          Manage product options (e.g., Color, Size, Material) that are used across your products.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="font-semibold mb-3">Create New Option</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:flex-1 sm:min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:flex-1 sm:min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Option Name</label>
            <input
              type="text"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              placeholder="e.g. Color"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <input
              type="number"
              value={newOptionPosition}
              onChange={(e) => setNewOptionPosition(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCreateOption}
            disabled={!selectedProductId || !newOptionName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 me-1 inline" />
            Create
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {options.length === 0 ? (
          <p className="text-gray-500">No product options created yet.</p>
        ) : (
          options.map((option) => (
            <div key={option.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{option.name}</h3>
                  <p className="text-sm text-gray-500">
                    Product: {products.find((p) => p.id === option.product)?.title || "—"}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteOption(option.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {(option.values || []).map((v) => (
                  <div key={v.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    {v.swatch && (
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: v.swatch }}
                      />
                    )}
                    <span>{v.value}</span>
                    <button
                      onClick={() => handleDeleteValue(option.id, v.id)}
                      className="ml-auto text-gray-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={valueInputs[option.id] || ""}
                  onChange={(e) =>
                    setValueInputs((prev) => ({ ...prev, [option.id]: e.target.value }))
                  }
                  placeholder="New value"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddValue(option.id)}
                />
                <input
                  type="text"
                  value={swatchInputs[option.id] || ""}
                  onChange={(e) =>
                    setSwatchInputs((prev) => ({ ...prev, [option.id]: e.target.value }))
                  }
                  placeholder="#hex"
                  className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => handleAddValue(option.id)}
                  className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
