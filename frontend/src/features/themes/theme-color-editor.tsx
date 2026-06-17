"use client";

import { useState } from "react";
import { Input, Label } from "@/shared/ui";
import type { ThemeConfig } from "@/shared/types";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

interface ThemeColorEditorProps {
  colors: ThemeConfig["colors"];
  onChange: (colors: ThemeConfig["colors"]) => void;
  parentColors?: ThemeConfig["colors"];
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

export function ThemeColorEditor({ colors, onChange, parentColors }: ThemeColorEditorProps) {
  const t = useTranslations("dashboard.themes");
  const handleChange = (key: keyof ThemeConfig["colors"], value: string) => {
    onChange({ ...colors, [key]: value });
  };

  const handleReset = (key: keyof ThemeConfig["colors"]) => {
    if (!parentColors) return;
    onChange({ ...colors, [key]: parentColors[key] });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">{t("colors")}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {COLOR_FIELDS.map(({ key, label }) => {
          const isOverridden = parentColors && colors[key] !== parentColors[key];
          return (
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
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs">{label}</Label>
                  {parentColors && (
                    <span className={`text-[10px] ${isOverridden ? "text-amber-600" : "text-gray-400"}`}>
                      {isOverridden ? "Overridden" : "Inherited"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    value={colors[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="h-8 text-xs"
                  />
                  {isOverridden && parentColors && (
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
