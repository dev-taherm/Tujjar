"use client";

import { useState } from "react";
import { useDuplicateTemplate } from "@/api/queries";
import type { Template } from "@/api/templates";
import { Button, Dialog } from "@/shared/ui";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface TemplateDuplicateDialogProps {
  template: Template;
  open: boolean;
  onClose: () => void;
}

export function TemplateDuplicateDialog({ template, open, onClose }: TemplateDuplicateDialogProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const [name, setName] = useState(`${template.name} copy`);
  const duplicate = useDuplicateTemplate();

  const handleConfirm = async () => {
    if (!name.trim()) return;
    try {
      await duplicate.mutateAsync({ id: template.id, name: name.trim() });
      toast.success(t("templateCreated"));
      onClose();
    } catch {
      toast.error("Failed to duplicate template");
    }
  };

  if (!open) return null;

  return (
    <Dialog open={true} onClose={onClose} title={t("duplicateTemplate")}>
      <p className="mb-4 text-sm text-gray-500">{t("duplicateTemplateDescription")}</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {tc("cancel")}
        </Button>
        <Button onClick={handleConfirm} disabled={!name.trim()} isLoading={duplicate.isPending}>
          <Copy className="me-1 h-3 w-3" />
          {t("duplicate")}
        </Button>
      </div>
    </Dialog>
  );
}
