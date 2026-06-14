"use client";

import { Input, Label } from "@/shared/ui";
import type { ThemeConfig } from "@/shared/types";
import { useTranslations } from "next-intl";

interface ThemeSpacingEditorProps {
  spacing: ThemeConfig["spacing"];
  onChange: (spacing: ThemeConfig["spacing"]) => void;
}

export function ThemeSpacingEditor({ spacing, onChange }: ThemeSpacingEditorProps) {
  const t = useTranslations("dashboard.themes");
  const handleChange = <K extends keyof ThemeConfig["spacing"]>(
    key: K,
    value: ThemeConfig["spacing"][K]
  ) => {
    onChange({ ...spacing, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">{t("spacing")}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("sectionPaddingY")}
          type="number"
          value={spacing.sectionPaddingY}
          onChange={(e) => handleChange("sectionPaddingY", Number(e.target.value))}
        />
        <Input
          label={t("sectionPaddingX")}
          type="number"
          value={spacing.sectionPaddingX}
          onChange={(e) => handleChange("sectionPaddingX", Number(e.target.value))}
        />
        <Input
          label={t("containerMaxWidth")}
          type="number"
          value={spacing.containerMaxWidth}
          onChange={(e) => handleChange("containerMaxWidth", Number(e.target.value))}
        />
        <Input
          label={t("gridGap")}
          type="number"
          value={spacing.gridGap}
          onChange={(e) => handleChange("gridGap", Number(e.target.value))}
        />
      </div>
    </div>
  );
}
