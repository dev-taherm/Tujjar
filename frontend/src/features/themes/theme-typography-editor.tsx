"use client";

import { Input, Label, Select } from "@/shared/ui";
import type { ThemeConfig } from "@/shared/types";

interface ThemeTypographyEditorProps {
  typography: ThemeConfig["typography"];
  onChange: (typography: ThemeConfig["typography"]) => void;
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "system-ui", label: "System UI" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Lato", label: "Lato" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Source Sans 3", label: "Source Sans 3" },
];

export function ThemeTypographyEditor({ typography, onChange }: ThemeTypographyEditorProps) {
  const handleChange = <K extends keyof ThemeConfig["typography"]>(
    key: K,
    value: ThemeConfig["typography"][K]
  ) => {
    onChange({ ...typography, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Typography</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Heading Font"
          options={FONT_OPTIONS}
          value={typography.headingFont}
          onChange={(e) => handleChange("headingFont", e.target.value)}
        />
        <Select
          label="Body Font"
          options={FONT_OPTIONS}
          value={typography.bodyFont}
          onChange={(e) => handleChange("bodyFont", e.target.value)}
        />
        <Input
          label="Base Font Size (px)"
          type="number"
          value={typography.baseFontSize}
          onChange={(e) => handleChange("baseFontSize", Number(e.target.value))}
        />
        <Input
          label="Scale Ratio"
          type="number"
          step="0.05"
          value={typography.scale}
          onChange={(e) => handleChange("scale", Number(e.target.value))}
        />
        <Input
          label="Line Height"
          type="number"
          step="0.1"
          value={typography.lineHeight}
          onChange={(e) => handleChange("lineHeight", Number(e.target.value))}
        />
      </div>
    </div>
  );
}
