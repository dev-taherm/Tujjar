"use client";

import { useState } from "react";
import { Search, LayoutTemplate } from "lucide-react";
import { useTemplateMarketplace, useInstallTemplate } from "@/api/templates";
import type { Template } from "@/api/templates";
import { TemplateCard } from "./template-card";
import { TemplatePreview } from "./template-preview";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "fashion", label: "Fashion" },
  { value: "electronics", label: "Electronics" },
  { value: "restaurant", label: "Restaurant" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "furniture", label: "Furniture" },
];

interface TemplateBrowserProps {
  storeId?: string;
}

export function TemplateBrowser({ storeId }: TemplateBrowserProps) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const { data, isLoading } = useTemplateMarketplace(category || undefined);
  const installMutation = useInstallTemplate();
  const queryClient = useQueryClient();

  const templates = (data?.results || []).filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const handleInstall = async (template: Template) => {
    if (!storeId) {
      toast.error("Please select a store first.");
      return;
    }
    setInstallingId(template.id);
    try {
      const result = await installMutation.mutateAsync({
        templateId: template.id,
        storeId: storeId as string,
      });
      toast.success(`Template "${template.name}" installed! ${result.pages_created} pages created.`);
      setPreviewTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    } catch {
      toast.error("Failed to install template. Please try again.");
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Templates</h2>
        <p className="text-gray-500">Choose a ready-to-use template for your store. Each includes pages, navigation, and theme.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                category === cat.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <LayoutTemplate className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No templates found</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={setPreviewTemplate}
              onInstall={handleInstall}
              isInstalling={installingId === template.id}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onInstall={handleInstall}
          isInstalling={installingId === previewTemplate.id}
        />
      )}
    </div>
  );
}
