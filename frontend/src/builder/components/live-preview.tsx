"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { StorefrontSectionRenderer } from "@/features/storefront/section-renderer";
import { DeviceFrame } from "@/builder/components/device-frame";
import type { Section } from "@/shared/types";
import { X, ExternalLink } from "lucide-react";

interface LivePreviewProps {
  sections: Section[];
  storeId?: string;
  storeSlug?: string;
  device: "desktop" | "tablet" | "mobile";
  onClose: () => void;
}

export function LivePreview({ sections, storeId, storeSlug, device, onClose }: LivePreviewProps) {
  const { data: storeData, isLoading } = useQuery({
    queryKey: ["storefront-preview", storeSlug],
    queryFn: async () => {
      if (!storeSlug) return null;
      const { data } = await apiClient.get(`/store/${storeSlug}/`);
      return data;
    },
    enabled: !!storeSlug,
  });

  const { data: products } = useQuery({
    queryKey: ["store-products-preview", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await apiClient.get(`/products/?store=${storeId}&status=active&limit=8`);
      return data?.results || [];
    },
    enabled: !!storeId,
  });

  const { data: collections } = useQuery({
    queryKey: ["store-collections-preview", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await apiClient.get(`/collections/?store=${storeId}&status=active`);
      return data?.results || [];
    },
    enabled: !!storeId,
  });

  const enrichedSections = sections.map((section) => {
    if (section.type === "product-grid" && products) {
      return {
        ...section,
        settings: {
          ...section.settings,
          _products: products,
        },
      };
    }
    if (section.type === "carousel" && products) {
      return {
        ...section,
        settings: {
          ...section.settings,
          _products: products,
        },
      };
    }
    return section;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Live Preview</h3>
          <span className="text-xs text-gray-500">{sections.length} sections</span>
          {storeSlug && (
            <a
              href={`/shop/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-3 w-3" /> Open storefront
            </a>
          )}
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <DeviceFrame device={device}>
            <div className="bg-white">
              {storeData ? (
                <div className="divide-y divide-gray-200">
                  {enrichedSections.map((section) => (
                    <div key={section.id} className="bg-white">
                      <StorefrontSectionRenderer
                        sections={[section]}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-gray-500">
                  <p>{storeSlug ? "Loading store data..." : "Select a store to preview with real data"}</p>
                </div>
              )}
            </div>
          </DeviceFrame>
        )}
      </div>
    </div>
  );
}
