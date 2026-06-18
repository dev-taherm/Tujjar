"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { productsApi, useProductOptions, useCreateProductOption, useDeleteProductOption, useAddOptionValue, useDeleteOptionValue } from "@/api/products";
import { toast } from "sonner";

export default function AttributesPage() {
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPosition, setNewOptionPosition] = useState(0);
  const [valueInputs, setValueInputs] = useState<Record<string, string>>({});
  const [swatchInputs, setSwatchInputs] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: options = [] } = useProductOptions("");
  const createOption = useCreateProductOption();
  const deleteOption = useDeleteProductOption();
  const addValue = useAddOptionValue();
  const deleteValue = useDeleteOptionValue();

  const handleCreateOption = async () => {
    if (!newOptionName.trim()) return;
    await createOption.mutateAsync({ productId: "", name: newOptionName, position: newOptionPosition });
    setNewOptionName("");
    toast.success("Option created");
  };

  const handleAddValue = async (optionId: string) => {
    const value = valueInputs[optionId];
    const swatch = swatchInputs[optionId];
    if (!value?.trim()) return;
    await addValue.mutateAsync({ productId: "", optionId, value, swatch });
    setValueInputs(prev => ({ ...prev, [optionId]: "" }));
    setSwatchInputs(prev => ({ ...prev, [optionId]: "" }));
    toast.success("Value added");
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm("Delete this option and all its values?")) return;
    await deleteOption.mutateAsync({ productId: "", optionId });
    toast.success("Option deleted");
  };

  const handleDeleteValue = async (optionId: string, valueId: string) => {
    await deleteValue.mutateAsync({ productId: "", optionId, valueId });
    toast.success("Value deleted");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Product Attributes</h1>
      <p className="text-gray-600 mb-4">Manage product options (e.g., Color, Size, Material) that are used across your products.</p>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
        <h2 className="font-semibold mb-3">Create New Option</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Option Name</label>
            <input
              type="text"
              value={newOptionName}
              onChange={e => setNewOptionName(e.target.value)}
              placeholder="e.g. Color"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium mb-1">Position</label>
            <input
              type="number"
              value={newOptionPosition}
              onChange={e => setNewOptionPosition(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={handleCreateOption}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {options.length === 0 ? (
          <p className="text-gray-500">No product options created yet.</p>
        ) : (
          options.map((option) => (
            <div key={option.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{option.name}</h3>
                <button
                  onClick={() => handleDeleteOption(option.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
              <div className="space-y-2">
                {(option.values || []).map((v) => (
                  <div key={v.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    {v.swatch && (
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: v.swatch }} />
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
                  onChange={e => setValueInputs(prev => ({ ...prev, [option.id]: e.target.value }))}
                  placeholder="New value"
                  className="flex-1 px-3 py-1.5 border rounded text-sm"
                  onKeyDown={e => e.key === "Enter" && handleAddValue(option.id)}
                />
                <input
                  type="text"
                  value={swatchInputs[option.id] || ""}
                  onChange={e => setSwatchInputs(prev => ({ ...prev, [option.id]: e.target.value }))}
                  placeholder="#hex"
                  className="w-24 px-3 py-1.5 border rounded text-sm"
                />
                <button
                  onClick={() => handleAddValue(option.id)}
                  className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200"
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
