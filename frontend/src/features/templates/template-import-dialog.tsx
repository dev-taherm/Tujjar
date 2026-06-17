"use client";

import { useState, useRef } from "react";
import { useImportTemplate } from "@/api/queries";
import { Button, Dialog } from "@/shared/ui";
import { Upload, FileJson, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface TemplateImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const EXPECTED_FORMAT = `{
  "name": "My Template",
  "slug": "my-template",
  "description": "A custom template",
  "version": "1.0.0",
  "category": "general",
  "config": {
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#10B981",
      "accent": "#F59E0B",
      "background": "#FFFFFF",
      "text": "#111827"
    },
    "typography": {
      "headingFont": "Inter",
      "bodyFont": "Inter"
    }
  },
  "pages": [
    {
      "title": "Home",
      "slug": "home",
      "page_type": "home",
      "sections": [
        { "type": "hero", "settings": { "title": "Welcome" } }
      ]
    }
  ],
  "navigation": {
    "logo_text": "My Store",
    "links": [
      { "label": "Home", "url": "/" },
      { "label": "Shop", "url": "/shop" }
    ]
  },
  "footer": {
    "columns": [
      {
        "title": "Links",
        "links": [{ "label": "About", "url": "/about" }]
      }
    ],
    "copyright": "2024 My Store"
  },
  "demo_content": {
    "collections": [],
    "categories": []
  }
}`;

export function TemplateImportDialog({ open, onClose }: TemplateImportDialogProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const importMutation = useImportTemplate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showFormat, setShowFormat] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.name || !data.slug || !data.config || !data.pages) {
          setParseError("Missing required fields: name, slug, config, pages");
          setParsedData(null);
          return;
        }
        setParsedData(data);
      } catch {
        setParseError("Invalid JSON file");
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedData) return;
    try {
      await importMutation.mutateAsync(parsedData);
      toast.success(t("templateCreated"));
      onClose();
      reset();
    } catch {
      toast.error("Failed to import template");
    }
  };

  const reset = () => {
    setFileName(null);
    setParsedData(null);
    setParseError(null);
    setShowFormat(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={true} onClose={handleClose} title={t("importTemplate")} maxWidth="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Upload a template JSON file to add it to your template library.
        </p>

        {/* Expected format */}
        <div className="rounded-lg border border-gray-200">
          <button
            onClick={() => setShowFormat(!showFormat)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showFormat ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Expected JSON format
          </button>
          {showFormat && (
            <div className="border-t border-gray-200 p-3">
              <pre className="max-h-60 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-600">
                {EXPECTED_FORMAT}
              </pre>
            </div>
          )}
        </div>

        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-sm text-gray-600 hover:border-blue-400 hover:bg-blue-50"
        >
          <Upload className="h-5 w-5" />
          {fileName || "Choose a JSON file"}
        </button>

        {parseError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{parseError}</div>
        )}

        {parsedData && !parseError && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              <span className="font-medium">{(parsedData.name as string) || "Imported Template"}</span>
            </div>
            <div className="mt-1 flex gap-3 text-xs text-green-600">
              <span>{(parsedData.pages as unknown[])?.length || 0} pages</span>
              <span>{(parsedData.category as string) || "general"}</span>
              <span>v{String(parsedData.version || "1.0.0")}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleImport} disabled={!parsedData || !!parseError || importMutation.isPending} isLoading={importMutation.isPending}>
            <Upload className="me-1 h-3 w-3" />
            {t("importTemplate")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
