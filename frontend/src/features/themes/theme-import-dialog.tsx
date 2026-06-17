"use client";

import { useState, useRef } from "react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/shared/ui";
import { Upload, FileJson, X } from "lucide-react";
import { useImportTheme } from "@/api/themes";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ThemeImportDialogProps {
  onClose: () => void;
}

export function ThemeImportDialog({ onClose }: ThemeImportDialogProps) {
  const t = useTranslations("dashboard.themes");
  const tc = useTranslations("common");
  const importTheme = useImportTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);

    if (file.name.endsWith(".zip")) {
      setParsedData({ _zipFile: file } as Record<string, unknown>);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.config || typeof data.config !== "object") {
          setParseError("Invalid theme file: missing 'config' object");
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
      if (parsedData._zipFile instanceof File) {
        await importTheme.mutateAsync(parsedData._zipFile as File);
      } else {
        await importTheme.mutateAsync({
          name: (parsedData.name as string) || "Imported Theme",
          config: parsedData.config as Record<string, unknown>,
          sections_schema: parsedData.sections_schema as Record<string, unknown>,
          assets: parsedData.assets as Record<string, unknown>,
          presets: parsedData.presets as Array<{ name: string; config: Record<string, unknown> }>,
          category: parsedData.category as string,
        });
      }
      toast.success(t("themeImported") || "Theme imported successfully");
      onClose();
    } catch {
      toast.error(t("importFailed") || "Failed to import theme");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("importTheme") || "Import Theme"}</CardTitle>
            <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            {t("importDescription") || "Upload a theme .json or .zip file (same format as export)"}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.zip"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-8 text-sm text-gray-600 hover:border-blue-400 hover:bg-blue-50"
          >
            <Upload className="h-5 w-5" />
            {fileName || t("chooseFile") || "Choose a JSON or ZIP file"}
          </button>

          {parseError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{parseError}</div>
          )}

          {parsedData && !parseError && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                <span className="font-medium">
                  {parsedData._zipFile instanceof File
                    ? (parsedData._zipFile as File).name
                    : (parsedData.name as string) || "Imported Theme"}
                </span>
              </div>
              {!(parsedData._zipFile instanceof File) && Boolean(parsedData.config) && typeof parsedData.config === "object" && (
                <p className="mt-1 text-xs text-green-600">
                  Config keys: {Object.keys(parsedData.config as Record<string, unknown>).join(", ")}
                </p>
              )}
              {!(parsedData._zipFile instanceof File) && Array.isArray(parsedData.presets) && (
                <p className="mt-1 text-xs text-green-600">
                  {parsedData.presets.length} preset(s)
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleImport} disabled={!parsedData || !!parseError} isLoading={importTheme.isPending}>
              {t("import") || "Import"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
