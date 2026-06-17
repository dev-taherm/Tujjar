"use client";

import { Input, Label } from "@/shared/ui";
import type { ThemeConfig } from "@/shared/types";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

interface ThemeSpacingEditorProps {
  spacing: ThemeConfig["spacing"];
  onChange: (spacing: ThemeConfig["spacing"]) => void;
  parentSpacing?: ThemeConfig["spacing"];
}

export function ThemeSpacingEditor({ spacing, onChange, parentSpacing }: ThemeSpacingEditorProps) {
  const t = useTranslations("dashboard.themes");
  const handleChange = <K extends keyof ThemeConfig["spacing"]>(
    key: K,
    value: ThemeConfig["spacing"][K]
  ) => {
    onChange({ ...spacing, [key]: value });
  };

  const handleReset = <K extends keyof ThemeConfig["spacing"]>(key: K) => {
    if (!parentSpacing) return;
    onChange({ ...spacing, [key]: parentSpacing[key] });
  };

  const fields: { key: keyof ThemeConfig["spacing"]; label: string }[] = [
    { key: "sectionPaddingY", label: t("sectionPaddingY") },
    { key: "sectionPaddingX", label: t("sectionPaddingX") },
    { key: "containerMaxWidth", label: t("containerMaxWidth") },
    { key: "gridGap", label: t("gridGap") },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">{t("spacing")}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label }) => {
          const isOverridden = parentSpacing && spacing[key] !== parentSpacing[key];
          return (
            <div key={key}>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">{label}</Label>
                {parentSpacing && (
                  <span className={`text-[10px] ${isOverridden ? "text-amber-600" : "text-gray-400"}`}>
                    {isOverridden ? "Overridden" : "Inherited"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={spacing[key]}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                />
                {isOverridden && parentSpacing && (
                  <button
                    type="button"
                    onClick={() => handleReset(key)}
                    title="Reset to parent"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
