"use client";

import { Input, Textarea, Select, Label } from "@/shared/ui";
import { useTranslations } from "next-intl";
import { TEMPLATE_CATEGORIES } from "@/lib/constants";
import type { Template } from "@/api/templates";

interface TemplateGeneralEditorProps {
  data: Partial<Template>;
  onChange: (data: Partial<Template>) => void;
}

export function TemplateGeneralEditor({ data, onChange }: TemplateGeneralEditorProps) {
  const t = useTranslations("dashboard.templates");

  const categories = TEMPLATE_CATEGORIES.filter((c) => c.value).map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const handleChange = (key: keyof Template, value: unknown) => {
    onChange({ ...data, [key]: value });
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(",").map((t) => t.trim()).filter(Boolean);
    onChange({ ...data, tags });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{t("pageName")}</Label>
        <Input
          value={data.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="My Template"
        />
      </div>
      <div>
        <Label>{t("pageSlug")}</Label>
        <Input
          value={data.slug || ""}
          onChange={(e) => handleChange("slug", e.target.value)}
          placeholder="my-template"
        />
      </div>
      <div>
        <Label>{t("templateEditor")}</Label>
        <Textarea
          value={data.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="A brief description of this template"
          rows={3}
        />
      </div>
      <div>
        <Label>{t("category")}</Label>
        <Select
          options={categories}
          value={data.category || "general"}
          onChange={(e) => handleChange("category", e.target.value)}
        />
      </div>
      <div>
        <Label>{t("category") === "Category" ? "Author" : t("category")}</Label>
        <Input
          value={data.author || ""}
          onChange={(e) => handleChange("author", e.target.value)}
          placeholder="Tujjar"
        />
      </div>
      <div>
        <Label>{t("tags") || "Tags"}</Label>
        <Input
          value={(data.tags || []).join(", ")}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="fashion, modern, minimal"
        />
        <p className="mt-1 text-xs text-gray-400">Comma-separated</p>
      </div>
    </div>
  );
}
