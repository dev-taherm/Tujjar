"use client";

import { useState } from "react";
import { useCreateTemplate } from "@/api/queries";
import { Button, Dialog, Input, Textarea, Select, Label } from "@/shared/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { TEMPLATE_CATEGORIES } from "@/lib/constants";

interface TemplateCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TemplateCreateDialog({ open, onClose }: TemplateCreateDialogProps) {
  const t = useTranslations("dashboard.templates");
  const tc = useTranslations("common");
  const createTemplate = useCreateTemplate();
  const router = useRouter();
  const locale = useLocale();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [autoSlug, setAutoSlug] = useState(true);

  const categories = TEMPLATE_CATEGORIES.filter((c) => c.value).map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const handleNameChange = (value: string) => {
    setName(value);
    if (autoSlug) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setAutoSlug(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const result = await createTemplate.mutateAsync({
        name: name.trim(),
        slug: slug || slugify(name),
        description: description.trim(),
        category,
        author: "Custom",
        config: {
          colors: {
            primary: "#3B82F6",
            secondary: "#10B981",
            accent: "#F59E0B",
            background: "#FFFFFF",
            text: "#111827",
            textSecondary: "#6B7280",
            border: "#E5E7EB",
            surface: "#F9FAFB",
            error: "#EF4444",
            success: "#10B981",
            warning: "#F59E0B",
          },
          typography: {
            headingFont: "Inter",
            bodyFont: "Inter",
            baseFontSize: 16,
            scale: 1.25,
            lineHeight: 1.5,
          },
          spacing: { section: 64, container: 1200, gutter: 24 },
          borderRadius: { small: 4, medium: 8, large: 16, full: 9999 },
          animations: { enabled: true, duration: "normal", easing: "ease" },
          darkMode: { enabled: false, strategy: "class" },
        },
        pages: [],
        navigation: { logo_text: name.trim() || "My Store", links: [], cta_button: { label: "", url: "", enabled: false } },
        footer: { columns: [], copyright: "", social_links: {} },
        seo_defaults: { title_pattern: `{{page_title}} | ${name.trim()}`, description_pattern: "" },
        demo_content: { collections: [], categories: [] },
        store_settings: {},
      } as never);
      toast.success(t("templateCreated"));
      onClose();
      router.push(`/${locale}/dashboard/templates/${result.id}`);
    } catch {
      toast.error("Failed to create template");
    }
  };

  if (!open) return null;

  return (
    <Dialog open={true} onClose={onClose} title={t("createTemplate")} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <Label>{t("pageName")}</Label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Custom Template"
            autoFocus
          />
        </div>
        <div>
          <Label>{t("pageSlug")}</Label>
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="my-custom-template"
          />
          <p className="mt-1 text-xs text-gray-400">Auto-generated from name</p>
        </div>
        <div>
          <Label>{t("templateEditor")}</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description"
            rows={2}
          />
        </div>
        <div>
          <Label>{t("category")}</Label>
          <Select
            options={categories}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()} isLoading={createTemplate.isPending}>
            {t("createTemplate")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
