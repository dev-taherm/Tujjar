"use client";

import { useState } from "react";
import { Input, Label } from "@/shared/ui";
import type { ThemeConfig } from "@/shared/types";

interface ThemeColorEditorProps {
  colors: ThemeConfig["colors"];
  onChange: (colors: ThemeConfig["colors"]) => void;
}

const COLOR_FIELDS = [
  { key: "primary" as const, label: "Primary" },
  { key: "secondary" as const, label: "Secondary" },
  { key: "accent" as const, label: "Accent" },
  { key: "background" as const, label: "Background" },
  { key: "surface" as const, label: "Surface" },
  { key: "text" as const, label: "Text" },
  { key: "textSecondary" as const, label: "Text Secondary" },
  { key: "border" as const, label: "Border" },
  { key: "error" as const, label: "Error" },
  { key: "success" as const, label: "Success" },
  { key: "warning" as const, label: "Warning" },
];

export function ThemeColorEditor({ colors, onChange }: ThemeColorEditorProps) {
  const handleChange = (key: keyof ThemeConfig["colors"], value: string) => {
    onChange({ ...colors, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Colors</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">{label}</Label>
              <Input
                value={colors[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
