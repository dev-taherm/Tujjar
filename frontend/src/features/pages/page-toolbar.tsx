"use client";

import { Button, Badge } from "@/shared/ui";
import { Save, Eye, EyeOff, Plus, History, Monitor, Tablet, Smartphone } from "lucide-react";

interface PageToolbarProps {
  pageTitle: string;
  isPublished: boolean;
  version: number;
  isDirty: boolean;
  isPreviewMode: boolean;
  onAddSection: () => void;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onTogglePreview: () => void;
  onShowHistory: () => void;
  isSaving?: boolean;
}

export function PageToolbar({
  pageTitle, isPublished, version, isDirty, isPreviewMode,
  onAddSection, onSave, onPublish, onUnpublish, onTogglePreview, onShowHistory, isSaving,
}: PageToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
        {isPublished ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        )}
        <span className="text-xs text-gray-400">v{version}</span>
        {isDirty && <Badge variant="warning">Unsaved</Badge>}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onAddSection}>
          <Plus className="mr-1 h-4 w-4" /> Add Section
        </Button>
        <Button variant="outline" size="sm" onClick={onTogglePreview}>
          {isPreviewMode ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
          {isPreviewMode ? "Edit" : "Preview"}
        </Button>
        <Button variant="outline" size="sm" onClick={onShowHistory}>
          <History className="mr-1 h-4 w-4" /> History
        </Button>
        <Button size="sm" onClick={onSave} isLoading={isSaving} disabled={!isDirty}>
          <Save className="mr-1 h-4 w-4" /> Save
        </Button>
        {isPublished ? (
          <Button variant="destructive" size="sm" onClick={onUnpublish}>Unpublish</Button>
        ) : (
          <Button size="sm" onClick={onPublish}>Publish</Button>
        )}
      </div>
    </div>
  );
}
