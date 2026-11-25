"use client";

import { useState, useRef } from "react";
import { useMediaAssets, useUploadMedia, useDeleteMedia, useMediaFolders, useCreateMediaFolder } from "@/api/queries";
import { useStores } from "@/api/queries";
import { Button, Input } from "@/shared/ui";
import { Upload, Image as ImageIcon, Film, FileText, FolderPlus, Trash2, Search, Grid, List, ArrowLeft, Folder, Eye } from "lucide-react";
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
    image: <ImageIcon className="h-5 w-5 text-primary-500" />,
    video: <Film className="h-5 w-5 text-purple-500" />,
    document: <FileText className="h-5 w-5 text-success" />,
    other: <FileText className="h-5 w-5 text-ink-soft" />,
  };

  const selected = assets?.find((a) => a.id === selectedAsset);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] overflow-hidden rounded-xl border border-line bg-panel">
      {/* Sidebar */}
      <div className="w-full md:w-56 border-e border-line flex flex-col">
        <div className="p-3 border-b border-line space-y-2">
          <Button onClick={() => fileInputRef.current?.click()} className="w-full" size="sm">
            <Upload className="me-1 h-4 w-4" /> {t("upload")}
          </Button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
          <Button variant="outline" onClick={() => setShowNewFolder(!showNewFolder)} className="w-full" size="sm">
            <FolderPlus className="me-1 h-4 w-4" /> {t("newFolder")}
          </Button>
        </div>
        <div className="p-2 space-y-1">
          <button onClick={() => setCurrentFolder(undefined)} className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${!currentFolder ? "bg-primary-50 text-primary-700" : "text-ink-soft hover:bg-rail"}`}>
            <Folder className="h-4 w-4" /> {t("allFiles")}
          </button>
          {folders?.map((f) => (
            <button key={f.id} onClick={() => setCurrentFolder(f.id)} className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${currentFolder === f.id ? "bg-primary-50 text-primary-700" : "text-ink-soft hover:bg-rail"}`}>
              <Folder className="h-4 w-4" />
              <span className="truncate">{f.name}</span>
              <span className="ms-auto text-xs text-ink-soft">{f.asset_count}</span>
            </button>
          ))}
        </div>
        {showNewFolder && (
          <div className="p-3 border-t border-line space-y-2">
            <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder={t("folderName")} className="w-full rounded-lg border border-line px-3 py-1.5 text-sm" onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }} />
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
        <div className="flex items-center gap-3 border-b border-line p-3">
          {currentFolder && (
            <button onClick={() => setCurrentFolder(undefined)} className="rounded p-1 hover:bg-rail">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
          )}
          {stores && stores.length > 1 && (
            <select
              value={selectedStoreId}
              onChange={(e) => { onStoreChange(e.target.value); setCurrentFolder(undefined); }}
              className="rounded-lg border border-line px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchFiles")} className="w-full rounded-lg border border-line py-1.5 ps-8 pe-3 text-sm" />
          </div>
          <div className="flex gap-1 rounded-lg border border-line p-0.5">
            <button onClick={() => setTypeFilter("")} className={`rounded px-2 py-1 text-xs ${!typeFilter ? "bg-rail" : ""}`}>{t("all")}</button>
            <button onClick={() => setTypeFilter("image")} className={`rounded px-2 py-1 text-xs ${typeFilter === "image" ? "bg-rail" : ""}`}>{t("images")}</button>
            <button onClick={() => setTypeFilter("video")} className={`rounded px-2 py-1 text-xs ${typeFilter === "video" ? "bg-rail" : ""}`}>{t("videos")}</button>
            <button onClick={() => setTypeFilter("document")} className={`rounded px-2 py-1 text-xs ${typeFilter === "document" ? "bg-rail" : ""}`}>{t("docs")}</button>
          </div>
          <div className="flex gap-1 rounded-lg border border-line p-0.5">
            <button onClick={() => setViewMode("grid")} className={`rounded p-1 ${viewMode === "grid" ? "bg-rail" : ""}`}><Grid className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("list")} className={`rounded p-1 ${viewMode === "list" ? "bg-rail" : ""}`}><List className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-square shimmer rounded-lg" />)}
            </div>
          ) : !assets?.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Upload className="mb-3 h-12 w-12 text-ink-soft" />
              <p className="text-sm text-ink-soft">{t("noFiles")}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {assets.map((asset) => (
                <div key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`group relative aspect-square cursor-pointer rounded-lg border-2 overflow-hidden transition-colors ${selectedAsset === asset.id ? "border-primary-400" : "border-transparent hover:border-line"}`}>
                  {asset.is_image ? (
                    <img src={asset.thumbnail_url || asset.file_url} alt={asset.alt_text || asset.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-rail">{typeIcons[asset.file_type]}</div>
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
                <div key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors ${selectedAsset === asset.id ? "bg-primary-50" : "hover:bg-rail"}`}>
                  {asset.is_image ? <img src={asset.thumbnail_url || asset.file_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-rail">{typeIcons[asset.file_type]}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{asset.title || asset.original_filename}</p>
                    <p className="text-xs text-ink-soft">{asset.file_size_display} - {formatDateTime(asset.created_at)}</p>
                  </div>
                   <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="rounded p-1 text-ink-soft md:opacity-0 md:group-hover:opacity-100 opacity-100 hover:bg-error-soft hover:text-error"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-full md:w-72 border-s border-line flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line p-3">
            <h3 className="text-sm font-semibold">{t("details")}</h3>
            <button onClick={() => setSelectedAsset(null)} className="text-ink-soft hover:text-ink-soft">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {selected?.is_image && (
              <img src={selected.file_url} alt={selected.alt_text} className="w-full rounded-lg" />
            )}
            <div className="space-y-2 text-sm">
              <div><span className="text-ink-soft">{t("name")}</span><p className="font-medium">{selected?.title || selected?.original_filename}</p></div>
              <div><span className="text-ink-soft">{t("type")}</span><p>{selected?.mime_type}</p></div>
              <div><span className="text-ink-soft">{t("size")}</span><p>{selected?.file_size_display}</p></div>
              {selected?.width && <div><span className="text-ink-soft">{t("dimensions")}</span><p>{selected?.width} x {selected?.height}</p></div>}
              <div><span className="text-ink-soft">{t("url")}</span><p className="text-xs break-all text-primary-600">{selected?.file_url}</p></div>
            </div>
            <Input label={t("altText")} value={selected?.alt_text || ""} onChange={() => {}} placeholder={t("describeImage")} />
          </div>
          <div className="border-t border-line p-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(selected?.file_url)}><Eye className="me-1 h-3 w-3" /> {t("view")}</Button>
            <Button variant="outline" size="sm" className="flex-1 text-error" onClick={() => handleDelete(selected?.id || "")}><Trash2 className="me-1 h-3 w-3" /> {tc("delete")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
