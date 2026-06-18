"use client";

import { useState } from "react";
import { Input, Textarea, Select, Label } from "@/shared/ui";
import { Toggle } from "@/shared/components/toggle";
import type { Section, SettingField } from "@/shared/types";
import { getRegistryEntry } from "@/builder/sections/registry";
import { MediaPickerModal } from "@/features/media/media-picker-modal";
import { useTranslations } from "next-intl";
import { ImageIcon } from "lucide-react";

type Tab = "content" | "style" | "advanced";

interface InspectorStyle {
  spacing?: { padding?: string; margin?: string };
  height?: { minHeight?: string; maxHeight?: string };
  background?: { color?: string; image?: string; size?: string; position?: string; repeat?: string };
  typography?: { fontFamily?: string; fontSize?: string; fontWeight?: string; lineHeight?: string; textAlign?: string; color?: string };
  animation?: { duration?: string; easing?: string; delay?: string };
}

interface InspectorAdvanced {
  cssClasses?: string;
  customCSS?: string;
}

interface EnhancedInspectorProps {
  section: Section;
  onUpdate: (settings: Record<string, unknown>) => void;
}

export function EnhancedInspector({ section, onUpdate }: EnhancedInspectorProps) {
  const t = useTranslations("dashboard.pages");
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [mediaPickerField, setMediaPickerField] = useState<string | null>(null);
  const definition = getRegistryEntry(section.type);

  const style: InspectorStyle = (section.settings as Record<string, unknown>).__style as InspectorStyle || {};
  const advanced: InspectorAdvanced = (section.settings as Record<string, unknown>).__advanced as InspectorAdvanced || {};

  const updateStyle = (patch: Partial<InspectorStyle>) => {
    onUpdate({ ...section.settings, __style: { ...style, ...patch } });
  };

  const updateAdvanced = (patch: Partial<InspectorAdvanced>) => {
    onUpdate({ ...section.settings, __advanced: { ...advanced, ...patch } });
  };

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ ...section.settings, [key]: value });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "content", label: t("inspectorContent") },
    { key: "style", label: t("inspectorStyle") },
    { key: "advanced", label: t("inspectorAdvanced") },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "content" && (
          <>
            {definition ? (
              <>
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
                    {field.type === "image" && (
                      <div>
                        <Label>{field.label}</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <div
                            className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors overflow-hidden"
                            onClick={() => setMediaPickerField(field.key)}
                          >
                            {(section.settings[field.key] as string) ? (
                              <img
                                src={section.settings[field.key] as string}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <Input
                              value={(section.settings[field.key] as string) || ""}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              placeholder="https://... or click to browse"
                            />
                            <button
                              onClick={() => setMediaPickerField(field.key)}
                              className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              {t("browseMedia")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-gray-500">{t("noSettingsForSection")}</p>
            )}
          </>
        )}

        {mediaPickerField && (
          <MediaPickerModal
            open={!!mediaPickerField}
            onClose={() => setMediaPickerField(null)}
            onSelect={(asset) => {
              handleChange(mediaPickerField, asset.file_url);
              setMediaPickerField(null);
            }}
          />
        )}

        {activeTab === "style" && (
          <>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("height")}</h4>
              <div className="space-y-2">
                <Input
                  label={t("minHeight")}
                  value={style.height?.minHeight || ""}
                  onChange={(e) => updateStyle({ height: { ...style.height, minHeight: e.target.value } })}
                  placeholder="auto, 300px, 50vh"
                />
                <Input
                  label={t("maxHeight")}
                  value={style.height?.maxHeight || ""}
                  onChange={(e) => updateStyle({ height: { ...style.height, maxHeight: e.target.value } })}
                  placeholder="none, 800px, 100vh"
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("spacing")}</h4>
              <div className="space-y-2">
                <Input
                  label={t("padding")}
                  value={style.spacing?.padding || ""}
                  onChange={(e) => updateStyle({ spacing: { ...style.spacing, padding: e.target.value } })}
                  placeholder="16px 24px"
                />
                <Input
                  label={t("margin")}
                  value={style.spacing?.margin || ""}
                  onChange={(e) => updateStyle({ spacing: { ...style.spacing, margin: e.target.value } })}
                  placeholder="0 auto"
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("background")}</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Label>{t("bgColor")}</Label>
                  <input
                    type="color"
                    value={style.background?.color || "#ffffff"}
                    onChange={(e) => updateStyle({ background: { ...style.background, color: e.target.value } })}
                    className="h-10 w-10 rounded-lg border border-gray-200"
                  />
                </div>
                <Input
                  label={t("bgImage")}
                  value={style.background?.image || ""}
                  onChange={(e) => updateStyle({ background: { ...style.background, image: e.target.value } })}
                  placeholder="url(...)"
                />
                <Select
                  label={t("bgSize")}
                  options={[
                    { label: t("cover"), value: "cover" },
                    { label: t("contain"), value: "contain" },
                    { label: t("auto"), value: "auto" },
                  ]}
                  value={style.background?.size || "cover"}
                  onChange={(e) => updateStyle({ background: { ...style.background, size: e.target.value } })}
                />
                <Select
                  label={t("bgPosition")}
                  options={[
                    { label: t("center"), value: "center" },
                    { label: t("top"), value: "top" },
                    { label: t("bottom"), value: "bottom" },
                    { label: t("left"), value: "left" },
                    { label: t("right"), value: "right" },
                  ]}
                  value={style.background?.position || "center"}
                  onChange={(e) => updateStyle({ background: { ...style.background, position: e.target.value } })}
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("typography")}</h4>
              <div className="space-y-2">
                <Input
                  label={t("fontFamily")}
                  value={style.typography?.fontFamily || ""}
                  onChange={(e) => updateStyle({ typography: { ...style.typography, fontFamily: e.target.value } })}
                  placeholder="Inter, sans-serif"
                />
                <Input
                  label={t("fontSize")}
                  value={style.typography?.fontSize || ""}
                  onChange={(e) => updateStyle({ typography: { ...style.typography, fontSize: e.target.value } })}
                  placeholder="16px"
                />
                <Select
                  label={t("fontWeight")}
                  options={[
                    { label: t("normal"), value: "normal" },
                    { label: t("medium"), value: "500" },
                    { label: t("semibold"), value: "600" },
                    { label: t("bold"), value: "bold" },
                  ]}
                  value={style.typography?.fontWeight || "normal"}
                  onChange={(e) => updateStyle({ typography: { ...style.typography, fontWeight: e.target.value } })}
                />
                <Input
                  label={t("lineHeight")}
                  value={style.typography?.lineHeight || ""}
                  onChange={(e) => updateStyle({ typography: { ...style.typography, lineHeight: e.target.value } })}
                  placeholder="1.5"
                />
                <Select
                  label={t("textAlign")}
                  options={[
                    { label: t("left"), value: "left" },
                    { label: t("center"), value: "center" },
                    { label: t("right"), value: "right" },
                  ]}
                  value={style.typography?.textAlign || "left"}
                  onChange={(e) => updateStyle({ typography: { ...style.typography, textAlign: e.target.value } })}
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("animation")}</h4>
              <div className="space-y-2">
                <Select
                  label={t("duration")}
                  options={[
                    { label: t("none"), value: "0s" },
                    { label: "Fast (0.2s)", value: "0.2s" },
                    { label: "Normal (0.3s)", value: "0.3s" },
                    { label: "Slow (0.5s)", value: "0.5s" },
                  ]}
                  value={style.animation?.duration || "0s"}
                  onChange={(e) => updateStyle({ animation: { ...style.animation, duration: e.target.value } })}
                />
                <Select
                  label={t("easing")}
                  options={[
                    { label: t("ease"), value: "ease" },
                    { label: t("easeIn"), value: "ease-in" },
                    { label: t("easeOut"), value: "ease-out" },
                    { label: t("easeInOut"), value: "ease-in-out" },
                    { label: t("linear"), value: "linear" },
                  ]}
                  value={style.animation?.easing || "ease"}
                  onChange={(e) => updateStyle({ animation: { ...style.animation, easing: e.target.value } })}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "advanced" && (
          <>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("cssClasses")}</h4>
              <Input
                value={advanced.cssClasses || ""}
                onChange={(e) => updateAdvanced({ cssClasses: e.target.value })}
                placeholder="my-custom-class another-class"
              />
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("customCSS")}</h4>
              <Textarea
                value={advanced.customCSS || ""}
                onChange={(e) => updateAdvanced({ customCSS: e.target.value })}
                placeholder={`.${section.type} { color: red; }`}
                rows={6}
              />
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">
                {t("advancedHint")}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
