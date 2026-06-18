"use client";

import { Input, Label } from "@/shared/ui";
import { Toggle } from "@/shared/components/toggle";
import { useTranslations } from "next-intl";
import { GripVertical, Trash2, Plus } from "lucide-react";

interface NavigationLink {
  label: string;
  url: string;
  order?: number;
}

interface CtaButton {
  label: string;
  url: string;
  enabled: boolean;
}

interface NavigationData {
  logo_text: string;
  links: NavigationLink[];
  cta_button?: CtaButton;
}

interface TemplateNavigationEditorProps {
  data: NavigationData;
  onChange: (data: NavigationData) => void;
}

export function TemplateNavigationEditor({ data, onChange }: TemplateNavigationEditorProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");

  const handleLogoTextChange = (value: string) => {
    onChange({ ...data, logo_text: value });
  };

  const handleLinkChange = (index: number, field: keyof NavigationLink, value: string) => {
    const links = [...data.links];
    links[index] = { ...links[index], [field]: value };
    onChange({ ...data, links });
  };

  const addLink = () => {
    onChange({
      ...data,
      links: [...data.links, { label: "New Link", url: "/", order: data.links.length }],
    });
  };

  const removeLink = (index: number) => {
    const links = data.links.filter((_, i) => i !== index);
    onChange({ ...data, links });
  };

  const moveLink = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= data.links.length) return;
    const links = [...data.links];
    const [removed] = links.splice(index, 1);
    links.splice(newIndex, 0, removed);
    onChange({ ...data, links });
  };

  const handleCtaChange = (field: keyof CtaButton, value: unknown) => {
    const cta = data.cta_button || { label: "", url: "", enabled: false };
    onChange({ ...data, cta_button: { ...cta, [field]: value } });
  };

  const cta = data.cta_button || { label: "", url: "", enabled: false };

  return (
    <div className="space-y-6">
      {/* Logo Text */}
      <div>
        <Label>{t("logoText")}</Label>
        <Input
          value={data.logo_text || ""}
          onChange={(e) => handleLogoTextChange(e.target.value)}
          placeholder="My Store"
        />
      </div>

      {/* Navigation Links */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>{t("navigation")}</Label>
          <button
            onClick={addLink}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3 w-3" />
            {t("addLink")}
          </button>
        </div>
        <div className="space-y-2">
          {data.links.map((link, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
              <GripVertical className="h-4 w-4 flex-shrink-0 text-gray-300 cursor-grab" />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={link.label}
                  onChange={(e) => handleLinkChange(i, "label", e.target.value)}
                  placeholder="Label"
                />
                <Input
                  value={link.url}
                  onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                  placeholder="/page"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => moveLink(i, -1)}
                  disabled={i === 0}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveLink(i, 1)}
                  disabled={i === data.links.length - 1}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeLink(i)}
                  className="rounded p-1 text-red-400 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {data.links.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">{t("noLinks") || "No links yet"}</p>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label>{t("ctaButton")}</Label>
          <Toggle
            enabled={cta.enabled}
            onToggle={() => handleCtaChange("enabled", !cta.enabled)}
          />
        </div>
        {cta.enabled && (
          <div className="space-y-3">
            <div>
              <Label>{t("logoText") === "Logo Text" ? "Button Label" : t("logoText")}</Label>
              <Input
                value={cta.label}
                onChange={(e) => handleCtaChange("label", e.target.value)}
                placeholder="Shop Now"
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={cta.url}
                onChange={(e) => handleCtaChange("url", e.target.value)}
                placeholder="/shop"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
