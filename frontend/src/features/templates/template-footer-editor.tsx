"use client";

import { Input, Label } from "@/shared/ui";
import { useTranslations } from "next-intl";
import { GripVertical, Trash2, Plus } from "lucide-react";

interface FooterLink {
  label: string;
  url: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterData {
  columns: FooterColumn[];
  copyright: string;
  social_links: Record<string, string>;
}

interface TemplateFooterEditorProps {
  data: FooterData;
  onChange: (data: FooterData) => void;
}

const SOCIAL_PLATFORMS = ["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok"];

export function TemplateFooterEditor({ data, onChange }: TemplateFooterEditorProps) {
  const t = useTranslations("dashboard.templates");

  const handleCopyrightChange = (value: string) => {
    onChange({ ...data, copyright: value });
  };

  const handleColumnChange = (index: number, field: keyof FooterColumn, value: unknown) => {
    const columns = [...data.columns];
    columns[index] = { ...columns[index], [field]: value };
    onChange({ ...data, columns });
  };

  const addColumn = () => {
    onChange({
      ...data,
      columns: [...data.columns, { title: "New Column", links: [] }],
    });
  };

  const removeColumn = (index: number) => {
    const columns = data.columns.filter((_, i) => i !== index);
    onChange({ ...data, columns });
  };

  const moveColumn = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= data.columns.length) return;
    const columns = [...data.columns];
    const [removed] = columns.splice(index, 1);
    columns.splice(newIndex, 0, removed);
    onChange({ ...data, columns });
  };

  const handleLinkChange = (colIndex: number, linkIndex: number, field: keyof FooterLink, value: string) => {
    const columns = [...data.columns];
    const links = [...columns[colIndex].links];
    links[linkIndex] = { ...links[linkIndex], [field]: value };
    columns[colIndex] = { ...columns[colIndex], links };
    onChange({ ...data, columns });
  };

  const addLink = (colIndex: number) => {
    const columns = [...data.columns];
    columns[colIndex] = {
      ...columns[colIndex],
      links: [...columns[colIndex].links, { label: "New Link", url: "/" }],
    };
    onChange({ ...data, columns });
  };

  const removeLink = (colIndex: number, linkIndex: number) => {
    const columns = [...data.columns];
    columns[colIndex] = {
      ...columns[colIndex],
      links: columns[colIndex].links.filter((_, i) => i !== linkIndex),
    };
    onChange({ ...data, columns });
  };

  const handleSocialChange = (platform: string, value: string) => {
    const social_links = { ...data.social_links };
    if (value) {
      social_links[platform] = value;
    } else {
      delete social_links[platform];
    }
    onChange({ ...data, social_links });
  };

  return (
    <div className="space-y-6">
      {/* Copyright */}
      <div>
        <Label>{t("copyright")}</Label>
        <Input
          value={data.copyright || ""}
          onChange={(e) => handleCopyrightChange(e.target.value)}
          placeholder="2024 My Store. All rights reserved."
        />
      </div>

      {/* Footer Columns */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>{t("footer")}</Label>
          <button
            onClick={addColumn}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3 w-3" />
            {t("addColumn")}
          </button>
        </div>
        <div className="space-y-3">
          {data.columns.map((column, colIndex) => (
            <div key={colIndex} className="rounded-lg border border-gray-200 p-3">
              <div className="mb-2 flex items-center gap-2">
                <GripVertical className="h-4 w-4 flex-shrink-0 text-gray-300 cursor-grab" />
                <Input
                  value={column.title}
                  onChange={(e) => handleColumnChange(colIndex, "title", e.target.value)}
                  placeholder="Column Title"
                  className="flex-1"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => moveColumn(colIndex, -1)}
                    disabled={colIndex === 0}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveColumn(colIndex, 1)}
                    disabled={colIndex === data.columns.length - 1}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeColumn(colIndex)}
                    className="rounded p-1 text-red-400 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Column Links */}
              <div className="ml-6 space-y-1">
                {column.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) => handleLinkChange(colIndex, linkIndex, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => handleLinkChange(colIndex, linkIndex, "url", e.target.value)}
                      placeholder="/page"
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeLink(colIndex, linkIndex)}
                      className="rounded p-1 text-red-400 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addLink(colIndex)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  {t("addLink")}
                </button>
              </div>
            </div>
          ))}
          {data.columns.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">{t("noColumns") || "No columns yet"}</p>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div>
        <Label>{t("socialLinks")}</Label>
        <div className="mt-2 space-y-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform} className="flex items-center gap-2">
              <span className="w-24 text-sm capitalize text-gray-600">{platform}</span>
              <Input
                value={data.social_links?.[platform] || ""}
                onChange={(e) => handleSocialChange(platform, e.target.value)}
                placeholder={`https://${platform}.com/...`}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
