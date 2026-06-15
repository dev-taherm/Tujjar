"use client";

import { Input, Textarea, Select, Label } from "@/shared/ui";
import { Toggle } from "@/shared/components/toggle";
import type { Section, SettingField } from "@/shared/types";
import { getRegistryEntry } from "@/builder/sections/registry";
import { useTranslations } from "next-intl";

interface SectionSettingsPanelProps {
  section: Section;
  onUpdate: (settings: Record<string, unknown>) => void;
}

export function SectionSettingsPanel({ section, onUpdate }: SectionSettingsPanelProps) {
  const t = useTranslations("dashboard.pages");
  const definition = getRegistryEntry(section.type);
  if (!definition) return <p className="text-sm text-gray-500">{t("noSettingsForSection")}</p>;

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ ...section.settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-sm font-semibold text-gray-900">{definition.label}</h3>
        <p className="text-xs text-gray-500">{t("configureSection")}</p>
      </div>
      {definition.settingsSchema.map((field: SettingField) => (
        <div key={field.key}>
          {field.type === "text" && (
            <Input
              label={field.label}
              value={(section.settings[field.key] as string) || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          )}
          {field.type === "textarea" && (
            <Textarea
              label={field.label}
              value={(section.settings[field.key] as string) || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          )}
          {field.type === "number" && (
            <Input
              label={field.label}
              type="number"
              value={String(section.settings[field.key] || "")}
              onChange={(e) => handleChange(field.key, Number(e.target.value))}
            />
          )}
          {field.type === "select" && (
            <Select
              label={field.label}
              options={field.options || []}
              value={String(section.settings[field.key] || "")}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          )}
          {field.type === "color" && (
            <div className="flex items-center gap-3">
              <Label>{field.label}</Label>
              <input
                type="color"
                value={(section.settings[field.key] as string) || "#000000"}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="h-10 w-10 rounded-lg border border-gray-200"
              />
              <Input
                value={(section.settings[field.key] as string) || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="h-8 flex-1"
              />
            </div>
          )}
          {field.type === "toggle" && (
            <Toggle label={field.label} enabled={!!section.settings[field.key]} onToggle={() => handleChange(field.key, !section.settings[field.key])} />
          )}
        </div>
      ))}
    </div>
  );
}
