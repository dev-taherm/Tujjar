"use client";

import { useState, useRef, useMemo } from "react";
import { Search, Upload, Image as ImageIcon, Check } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui";
import { useMediaAssets, useUploadMedia } from "@/api/media";
import type { MediaAsset } from "@/shared/types";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  storeId?: string;
}

export function MediaPickerModal({ open, onClose, onSelect, storeId }: MediaPickerModalProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMedia = useUploadMedia();

  const { data: storeAssets, isLoading: storeLoading } = useMediaAssets({
    store: storeId,
    file_type: "image",
    search: search || undefined,
  });

  const { data: orgAssets, isLoading: orgLoading } = useMediaAssets({
    file_type: "image",
    search: search || undefined,
  });

  const isLoading = storeLoading || orgLoading;

  const orgOnlyAssets = useMemo(() => {
    if (!orgAssets) return [];
    const storeIds = new Set((storeAssets || []).map((a) => a.id));
    return orgAssets.filter((a) => !storeIds.has(a.id));
  }, [orgAssets, storeAssets]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storeId) return;
    const asset = await uploadMedia.mutateAsync({ file, store: storeId, title: file.name });
    onSelect(asset);
    onClose();
    e.target.value = "";
  };

  const handleSelect = () => {
    if (!selectedId) return;
    const all = [...(storeAssets || []), ...orgOnlyAssets];
    const asset = all.find((a) => a.id === selectedId);
    if (asset) {
      onSelect(asset);
      onClose();
    }
  };

  const renderGrid = (assets: MediaAsset[]) => (
    <div className="grid grid-cols-4 gap-2">
      {assets.map((asset) => (
        <button
          key={asset.id}
          onClick={() => setSelectedId(selectedId === asset.id ? null : asset.id)}
          className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
            selectedId === asset.id
              ? "border-primary-500 ring-2 ring-primary-200"
              : "border-transparent hover:border-line"
          }`}
        >
          <img
            src={asset.thumbnail_url || asset.file_url}
            alt={asset.alt_text || asset.title}
            className="h-full w-full object-cover"
          />
          {selectedId === asset.id && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary-500/20">
              <div className="rounded-full bg-primary-600 p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="truncate text-[10px] text-white">{asset.title || asset.filename}</p>
          </div>
        </button>
      ))}
    </div>
  );

  const hasAnyAssets = (storeAssets && storeAssets.length > 0) || orgOnlyAssets.length > 0;

  return (
    <Dialog open={open} onClose={onClose} title="Choose Image" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-panel ps-10 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMedia.isPending || !storeId}
          >
            <Upload className="me-1.5 h-4 w-4" />
            {uploadMedia.isPending ? "Uploading..." : "Upload New"}
          </Button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square shimmer rounded-lg" />
              ))}
            </div>
          ) : !hasAnyAssets ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-ink-soft" />
              <p className="mt-3 text-sm font-medium text-ink">No images</p>
              <p className="mt-1 text-xs text-ink-soft">
                {search ? "No images match your search." : "Upload your first image to get started."}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
                disabled={!storeId}
              >
                <Upload className="me-1.5 h-3.5 h-3.5" />
                Upload Image
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {storeAssets && storeAssets.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold text-ink-soft">This Store</h4>
                  {renderGrid(storeAssets)}
                </div>
              )}
              {orgOnlyAssets.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold text-ink-soft">All Organizations</h4>
                  {renderGrid(orgOnlyAssets)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-3">
          <p className="text-xs text-ink-soft">
            {hasAnyAssets
              ? `${(storeAssets?.length || 0) + orgOnlyAssets.length} image${(storeAssets?.length || 0) + orgOnlyAssets.length !== 1 ? "s" : ""}`
              : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSelect} disabled={!selectedId}>
              Select Image
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
