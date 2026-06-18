"use client";

import { useState } from "react";
import { X, Palette, Check } from "lucide-react";
import { Button } from "@/shared/ui";
import type { ThemeOverride, ThemeConfig } from "@/shared/types";
import { useTranslations } from "next-intl";

interface ThemePickerProps {
  currentOverride: ThemeOverride | null;
  onSelect: (override: ThemeOverride | null) => void;
  onClose: () => void;
}

const PRESET_OVERRIDES: Array<{ name: string; label: string; override: ThemeOverride }> = [
  {
    name: "default",
    label: "Default (Store Theme)",
    override: {},
  },
  {
    name: "warm",
    label: "Warm Tones",
    override: {
      colors: { primary: "#EA580C", secondary: "#DC2626", accent: "#F59E0B" },
    },
  },
  {
    name: "cool",
    label: "Cool Tones",
    override: {
      colors: { primary: "#2563EB", secondary: "#7C3AED", accent: "#06B6D4" },
    },
  },
  {
    name: "nature",
    label: "Nature",
    override: {
      colors: { primary: "#16A34A", secondary: "#15803D", accent: "#84CC16" },
    },
  },
  {
    name: "elegant",
    label: "Elegant",
    override: {
      colors: { primary: "#1F2937", secondary: "#374151", accent: "#D1D5DB" },
      typography: { headingFont: "Playfair Display", bodyFont: "Inter" },
    },
  },
  {
    name: "playful",
    label: "Playful",
    override: {
      colors: { primary: "#EC4899", secondary: "#8B5CF6", accent: "#FBBF24" },
    },
  },
];

export function ThemePicker({ currentOverride, onSelect, onClose }: ThemePickerProps) {
  const t = useTranslations("dashboard.pages");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    currentOverride ? "custom" : "default"
  );

  const handleApply = () => {
    const preset = PRESET_OVERRIDES.find((p) => p.name === selectedPreset);
    if (preset) {
      onSelect(preset.name === "default" ? null : preset.override);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">{t("pageTheme")}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">{t("pageThemeDescription")}</p>

        <div className="space-y-2">
          {PRESET_OVERRIDES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setSelectedPreset(preset.name)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selectedPreset === preset.name
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex gap-1">
                {preset.override.colors && (
                  <>
                    <div
                      className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.override.colors.primary }}
                    />
                    <div
                      className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.override.colors.secondary }}
                    />
                    <div
                      className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.override.colors.accent }}
                    />
                  </>
                )}
                {!preset.override.colors && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                    ★
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{preset.label}</p>
                {preset.override.typography && (
                  <p className="text-xs text-gray-500">
                    {preset.override.typography.headingFont} + {preset.override.typography.bodyFont}
                  </p>
                )}
              </div>
              {selectedPreset === preset.name && (
                <Check className="h-5 w-5 text-blue-600" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button size="sm" onClick={handleApply}>
            {t("apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
