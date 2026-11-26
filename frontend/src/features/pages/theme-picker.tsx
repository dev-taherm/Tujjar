"use client";

import { useState } from "react";
import { X, Palette, Check } from "lucide-react";
import { Button } from "@/shared/ui";
import type { ThemeOverride } from "@/shared/types";
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
    name: "mudbrick",
    label: "Mudbrick",
    override: {
      colors: { primary: "#96522E", secondary: "#8A6B4F", accent: "#D69229" },
    },
  },
  {
    name: "cobalt",
    label: "Cobalt",
    override: {
      colors: { primary: "#2D5F8C", secondary: "#173F5E", accent: "#3E7050" },
    },
  },
  {
    name: "glass-green",
    label: "Glass Green",
    override: {
      colors: { primary: "#3E7050", secondary: "#2D6A4F", accent: "#D69229" },
    },
  },
  {
    name: "elegant",
    label: "Elegant",
    override: {
      colors: { primary: "#1F2937", secondary: "#374151", accent: "#D69229" },
      typography: { headingFont: "Playfair Display", bodyFont: "Inter" },
    },
  },
  {
    name: "amber",
    label: "Amber",
    override: {
      colors: { primary: "#D69229", secondary: "#B2761D", accent: "#96522E" },
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
      <div className="w-full max-w-lg rounded-2xl bg-panel p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold">{t("pageTheme")}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-rail">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-ink-soft">{t("pageThemeDescription")}</p>

        <div className="space-y-2">
          {PRESET_OVERRIDES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setSelectedPreset(preset.name)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-start transition-colors ${
                selectedPreset === preset.name
                  ? "border-primary-500 bg-primary-50"
                  : "border-line hover:border-line hover:bg-rail"
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
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rail text-xs text-ink-soft">
                    ★
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{preset.label}</p>
                {preset.override.typography && (
                  <p className="text-xs text-ink-soft">
                    {preset.override.typography.headingFont} + {preset.override.typography.bodyFont}
                  </p>
                )}
              </div>
              {selectedPreset === preset.name && (
                <Check className="h-5 w-5 text-primary-600" />
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
