"use client";

import { useState, useRef } from "react";
import { useMediaAssets, useUploadMedia, useDeleteMedia, useMediaFolders, useCreateMediaFolder } from "@/api/queries";
import { useStores } from "@/api/queries";
import { Button, Input, Badge } from "@/shared/ui";
import { Upload, Image, Film, FileText, FolderPlus, Trash2, Search, Grid, List, ArrowLeft, Folder, Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type ViewMode = "grid" | "list";

interface MediaGalleryProps {
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
}

export function MediaGallery({ selectedStoreId, onStoreChange }: MediaGalleryProps) {
  const t = useTranslations("dashboard.media");
  const tc = useTranslations("common");
  const { data: stores } = useStores();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: assets, isLoading } = useMediaAssets({
    store: selectedStoreId || undefined,
    folder: currentFolder,
    file_type: typeFilter || undefined,
    search: search || undefined,
  });
  const { data: folders } = useMediaFolders({ store: selectedStoreId || undefined, parent: currentFolder });
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const createFolder = useCreateMediaFolder();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const ALLOWED_MIME_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/webm", "video/ogg",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain", "text/csv",
  ];
  const BLOCKED_EXTENSIONS = [".php", ".exe", ".bat", ".sh", ".js", ".vbs", ".svg", ".svgz"];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return `File "${file.name}" exceeds 50MB limit`;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) return `File type "${ext}" is not allowed`;
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith("text/")) {
      return `File type "${file.type}" is not allowed`;
    }
    return null;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      await uploadMedia.mutateAsync({ file, folder: currentFolder, store: selectedStoreId || undefined });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    await createFolder.mutateAsync({ name: newFolderName, parent: currentFolder });
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("deleteAssetConfirm"))) {
      await deleteMedia.mutateAsync(id);
      if (selectedAsset === id) setSelectedAsset(null);
    }
  };

  const typeIcons: Record<string, React.ReactNode> = {
    image: <Image className="h-5 w-5 text-blue-500" />,
    video: <Film className="h-5 w-5 text-purple-500" />,
    document: <FileText className="h-5 w-5 text-green-500" />,
    other: <FileText className="h-5 w-5 text-gray-500" />,
  };

  const selected = assets?.find((a) => a.id === selectedAsset);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Sidebar */}
      <div className="w-full md:w-56 border-e border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200 space-y-2">
          <Button onClick={() => fileInputRef.current?.click()} className="w-full" size="sm">
            <Upload className="me-1 h-4 w-4" /> {t("upload")}
          </Button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
          <Button variant="outline" onClick={() => setShowNewFolder(!showNewFolder)} className="w-full" size="sm">
            <FolderPlus className="me-1 h-4 w-4" /> {t("newFolder")}
          </Button>
        </div>
        <div className="p-2 space-y-1">
          <button onClick={() => setCurrentFolder(undefined)} className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${!currentFolder ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
            <Folder className="h-4 w-4" /> {t("allFiles")}
          </button>
          {folders?.map((f) => (
            <button key={f.id} onClick={() => setCurrentFolder(f.id)} className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${currentFolder === f.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <Folder className="h-4 w-4" />
              <span className="truncate">{f.name}</span>
              <span className="ms-auto text-xs text-gray-400">{f.asset_count}</span>
            </button>
          ))}
        </div>
        {showNewFolder && (
          <div className="p-3 border-t border-gray-200 space-y-2">
            <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder={t("folderName")} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }} />
            <div className="flex gap-1">
              <Button size="sm" onClick={handleCreateFolder}>{tc("create")}</Button>
              <Button variant="outline" size="sm" onClick={() => setShowNewFolder(false)}>{tc("cancel")}</Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-gray-200 p-3">
          {currentFolder && (
            <button onClick={() => setCurrentFolder(undefined)} className="rounded p-1 hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
          )}
          {stores && stores.length > 1 && (
            <select
              value={selectedStoreId}
              onChange={(e) => { onStoreChange(e.target.value); setCurrentFolder(undefined); }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchFiles")} className="w-full rounded-lg border border-gray-200 py-1.5 ps-8 pe-3 text-sm" />
          </div>
          <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
            <button onClick={() => setTypeFilter("")} className={`rounded px-2 py-1 text-xs ${!typeFilter ? "bg-gray-100" : ""}`}>{t("all")}</button>
            <button onClick={() => setTypeFilter("image")} className={`rounded px-2 py-1 text-xs ${typeFilter === "image" ? "bg-gray-100" : ""}`}>{t("images")}</button>
            <button onClick={() => setTypeFilter("video")} className={`rounded px-2 py-1 text-xs ${typeFilter === "video" ? "bg-gray-100" : ""}`}>{t("videos")}</button>
            <button onClick={() => setTypeFilter("document")} className={`rounded px-2 py-1 text-xs ${typeFilter === "document" ? "bg-gray-100" : ""}`}>{t("docs")}</button>
          </div>
          <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
            <button onClick={() => setViewMode("grid")} className={`rounded p-1 ${viewMode === "grid" ? "bg-gray-100" : ""}`}><Grid className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("list")} className={`rounded p-1 ${viewMode === "list" ? "bg-gray-100" : ""}`}><List className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-200" />)}
            </div>
          ) : !assets?.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Upload className="mb-3 h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">{t("noFiles")}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {assets.map((asset) => (
                <div key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`group relative aspect-square cursor-pointer rounded-lg border-2 overflow-hidden transition-colors ${selectedAsset === asset.id ? "border-blue-400" : "border-transparent hover:border-gray-200"}`}>
                  {asset.is_image ? (
                    <img src={asset.thumbnail_url || asset.file_url} alt={asset.alt_text || asset.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-50">{typeIcons[asset.file_type]}</div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 md:opacity-0 md:group-hover:opacity-100 opacity-100">
                    <p className="text-xs text-white truncate">{asset.title || asset.original_filename}</p>
                    <p className="text-xs text-white/70">{asset.file_size_display}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {assets.map((asset) => (
                <div key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors ${selectedAsset === asset.id ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                  {asset.is_image ? <img src={asset.thumbnail_url || asset.file_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">{typeIcons[asset.file_type]}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{asset.title || asset.original_filename}</p>
                    <p className="text-xs text-gray-500">{asset.file_size_display} - {formatDateTime(asset.created_at)}</p>
                  </div>
                   <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="rounded p-1 text-gray-400 md:opacity-0 md:group-hover:opacity-100 opacity-100 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-full md:w-72 border-s border-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 p-3">
            <h3 className="text-sm font-semibold">{t("details")}</h3>
            <button onClick={() => setSelectedAsset(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {selected?.is_image && (
              <img src={selected.file_url} alt={selected.alt_text} className="w-full rounded-lg" />
            )}
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">{t("name")}</span><p className="font-medium">{selected?.title || selected?.original_filename}</p></div>
              <div><span className="text-gray-500">{t("type")}</span><p>{selected?.mime_type}</p></div>
              <div><span className="text-gray-500">{t("size")}</span><p>{selected?.file_size_display}</p></div>
              {selected?.width && <div><span className="text-gray-500">{t("dimensions")}</span><p>{selected?.width} x {selected?.height}</p></div>}
              <div><span className="text-gray-500">{t("url")}</span><p className="text-xs break-all text-blue-600">{selected?.file_url}</p></div>
            </div>
            <Input label={t("altText")} value={selected?.alt_text || ""} onChange={() => {}} placeholder={t("describeImage")} />
          </div>
          <div className="border-t border-gray-200 p-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(selected?.file_url)}><Eye className="me-1 h-3 w-3" /> {t("view")}</Button>
            <Button variant="outline" size="sm" className="flex-1 text-red-600" onClick={() => handleDelete(selected?.id || "")}><Trash2 className="me-1 h-3 w-3" /> {tc("delete")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
