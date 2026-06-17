"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/shared/ui";
import { useTranslations } from "next-intl";

interface TemplateOverwriteWarningProps {
  replaced: { pages: number; collections: number; categories: number };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TemplateOverwriteWarning({
  replaced,
  onConfirm,
  onCancel,
  isLoading,
}: TemplateOverwriteWarningProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const hasReplaced = replaced.pages > 0 || replaced.collections > 0 || replaced.categories > 0;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800">
            {hasReplaced ? "This will replace existing content" : "Ready to install"}
          </h4>
          {hasReplaced ? (
            <div className="mt-2 space-y-1 text-sm text-amber-700">
              {replaced.pages > 0 && (
                <p>{replaced.pages} existing page{replaced.pages !== 1 ? "s" : ""} will be replaced</p>
              )}
              {replaced.collections > 0 && (
                <p>{replaced.collections} collection{replaced.collections !== 1 ? "s" : ""} will be replaced</p>
              )}
              {replaced.categories > 0 && (
                <p>{replaced.categories} categor{replaced.categories !== 1 ? "ies" : "y"} will be replaced</p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-sm text-amber-700">
              No existing content will be replaced.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              {tc("cancel")}
            </Button>
            <Button size="sm" onClick={onConfirm} isLoading={isLoading}>
              {hasReplaced ? "Replace & Install" : "Install"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
