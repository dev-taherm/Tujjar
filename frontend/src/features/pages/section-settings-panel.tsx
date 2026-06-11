"use client";

import { Input, Textarea, Select, Label } from "@/shared/ui";
import type { Section, SettingField } from "@/shared/types";
import { getRegistryEntry } from "@/builder/sections/registry";

interface SectionSettingsPanelProps {
  section: Section;
  onUpdate: (settings: Record<string, unknown>) => void;
}

export function SectionSettingsPanel({ section, onUpdate }: SectionSettingsPanelProps) {
  const definition = getRegistryEntry(section.type);
  if (!definition) return <p className="text-sm text-gray-500">No settings for this section type.</p>;

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ ...section.settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-sm font-semibold text-gray-900">{definition.label}</h3>
        <p className="text-xs text-gray-500">Configure this section</p>
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
            <div className="flex items-center justify-between">
              <Label>{field.label}</Label>
              <button
                type="button"
                onClick={() => handleChange(field.key, !section.settings[field.key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  section.settings[field.key] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    section.settings[field.key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
