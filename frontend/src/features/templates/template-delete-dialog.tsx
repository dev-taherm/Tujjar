"use client";

import { useDeleteTemplate } from "@/api/queries";
import type { Template } from "@/api/templates";
import { Button, Dialog } from "@/shared/ui";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface TemplateDeleteDialogProps {
  template: Template;
  open: boolean;
  onClose: () => void;
}

export function TemplateDeleteDialog({ template, open, onClose }: TemplateDeleteDialogProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const deleteTemplate = useDeleteTemplate();

  const handleConfirm = async () => {
    try {
      await deleteTemplate.mutateAsync(template.id);
      toast.success(t("templateDeleted"));
      onClose();
    } catch {
      toast.error("Failed to delete template");
    }
  };

  if (!open) return null;

  return (
    <Dialog open={true} onClose={onClose} title={t("deleteTemplate")}>
      <p className="mb-4 text-sm text-gray-600">
        {t("deleteTemplateConfirm", { name: template.name })}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {tc("cancel")}
        </Button>
        <Button variant="destructive" onClick={handleConfirm} isLoading={deleteTemplate.isPending}>
          <Trash2 className="me-1 h-3 w-3" />
          {tc("delete")}
        </Button>
      </div>
    </Dialog>
  );
}
