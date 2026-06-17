"use client";

import { useExportTemplate } from "@/api/queries";
import type { Template } from "@/api/templates";
import { Button, Dialog } from "@/shared/ui";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface TemplateExportDialogProps {
  template: Template;
  open: boolean;
  onClose: () => void;
}

export function TemplateExportDialog({ template, open, onClose }: TemplateExportDialogProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const exportMutation = useExportTemplate();

  const handleExport = async () => {
    try {
      const data = await exportMutation.mutateAsync(template.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.slug}-template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("export") + " successful");
      onClose();
    } catch {
      toast.error("Failed to export template");
    }
  };

  if (!open) return null;

  return (
    <Dialog open={true} onClose={onClose} title={t("export")}>
      <p className="mb-4 text-sm text-gray-600">
        Export &ldquo;{template.name}&rdquo; as a JSON file. You can import it into other stores later.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {tc("cancel")}
        </Button>
        <Button onClick={handleExport} disabled={exportMutation.isPending} isLoading={exportMutation.isPending}>
          <Download className="me-1 h-3 w-3" />
          {t("export")}
        </Button>
      </div>
    </Dialog>
  );
}
