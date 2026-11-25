"use client";

import { Input, Label, Select } from "@/shared/ui";
import type { ThemeConfig } from "@/shared/types";
import { FONT_OPTIONS } from "@/lib/fonts";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

interface ThemeTypographyEditorProps {
  typography: ThemeConfig["typography"];
  onChange: (typography: ThemeConfig["typography"]) => void;
  parentTypography?: ThemeConfig["typography"];
}

export function ThemeTypographyEditor({ typography, onChange, parentTypography }: ThemeTypographyEditorProps) {
  const t = useTranslations("dashboard.themes");
  const handleChange = <K extends keyof ThemeConfig["typography"]>(
    key: K,
    value: ThemeConfig["typography"][K]
  ) => {
    onChange({ ...typography, [key]: value });
  };

  const handleReset = <K extends keyof ThemeConfig["typography"]>(key: K) => {
    if (!parentTypography) return;
    onChange({ ...typography, [key]: parentTypography[key] });
  };

  // Optional fields: clearing the input removes the value entirely (falls
  // back to the theme default). Required numeric fields keep the old
  // always-a-number behavior.
  const OPTIONAL_FIELDS = new Set<keyof ThemeConfig["typography"]>([
    "headingWeight",
    "headingLetterSpacing",
    "letterSpacing",
  ]);

  const fields: { key: keyof ThemeConfig["typography"]; label: string; type?: string; step?: string }[] = [
    { key: "headingFont", label: t("headingFont") },
    { key: "bodyFont", label: t("bodyFont") },
    { key: "baseFontSize", label: t("baseFontSize"), type: "number" },
    { key: "scale", label: t("scaleRatio"), type: "number", step: "0.05" },
    { key: "lineHeight", label: t("lineHeight"), type: "number", step: "0.1" },
    { key: "headingWeight", label: t("headingWeight"), type: "number", step: "100" },
    { key: "headingLetterSpacing", label: t("headingLetterSpacing"), type: "number", step: "0.5" },
    { key: "letterSpacing", label: t("letterSpacing"), type: "number", step: "0.1" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-ink">{t("typography")}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, type, step }) => {
          const isOverridden = parentTypography && typography[key] !== parentTypography[key];
          return (
            <div key={key}>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">{label}</Label>
                {parentTypography && (
                  <span className={`text-[10px] ${isOverridden ? "text-warning" : "text-ink-soft"}`}>
                    {isOverridden ? "Overridden" : "Inherited"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {key === "headingFont" || key === "bodyFont" ? (
                  <Select
                    options={FONT_OPTIONS}
                    value={typography[key] as string}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                ) : (
                  <Input
                    type={type || "text"}
                    step={step}
                    value={(typography[key] as number) ?? ""}
                    onChange={(e) =>
                      handleChange(
                        key,
                        e.target.value === "" && OPTIONAL_FIELDS.has(key)
                          ? (undefined as never)
                          : Number(e.target.value)
                      )
                    }
                  />
                )}
                {isOverridden && parentTypography && (
                  <button
                    type="button"
                    onClick={() => handleReset(key)}
                    title="Reset to parent"
                    className="rounded p-1 text-ink-soft hover:bg-rail hover:text-ink-soft"
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
