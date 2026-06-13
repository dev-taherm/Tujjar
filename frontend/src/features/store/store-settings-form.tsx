"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/shared/ui";
import { useUpdateStore } from "@/api/queries";
import { TemplateBrowser } from "@/features/templates/template-browser";
import type { Store } from "@/shared/types";
import {
  Settings,
  LayoutTemplate,
  Palette,
  FileText,
} from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "template", label: "Template", icon: LayoutTemplate },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "pages", label: "Pages", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface StoreSettingsFormProps {
  store: Store;
}

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const updateStore = useUpdateStore();

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "general" && <GeneralTab store={store} updateStore={updateStore} />}
      {activeTab === "template" && <TemplateTab store={store} />}
      {activeTab === "theme" && <ThemeTab store={store} />}
      {activeTab === "pages" && <PagesTab store={store} />}
    </div>
  );
}

/* ── General Tab ─────────────────────────────────────────────────────── */

function GeneralTab({ store, updateStore }: { store: Store; updateStore: ReturnType<typeof useUpdateStore> }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: store.name,
      description: store.description,
      seo_title: store.seo_title,
      seo_description: store.seo_description,
    },
  });

  const onSubmit = async (data: SettingsForm) => {
    await updateStore.mutateAsync({ id: store.id, ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Store Name"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Description"
            placeholder="A brief description of your store"
            {...register("description")}
          />
          <Input
            label="SEO Title"
            placeholder="Page title for search engines"
            {...register("seo_title")}
          />
          <Input
            label="SEO Description"
            placeholder="Page description for search engines"
            {...register("seo_description")}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

/* ── Template Tab ────────────────────────────────────────────────────── */

function TemplateTab({ store }: { store: Store }) {
  return (
    <div>
      {store.template && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              This store uses a custom template. Install a new one below to replace it.
            </p>
          </CardContent>
        </Card>
      )}
      <TemplateBrowser storeId={store.id} />
    </div>
  );
}

/* ── Theme Tab ───────────────────────────────────────────────────────── */

function ThemeTab({ store }: { store: Store }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          {store.theme ? "Manage your store's visual theme." : "No theme applied yet. Install a template from the Template tab to set up your theme."}
        </p>
      </CardContent>
    </Card>
  );
}

/* ── Pages Tab ───────────────────────────────────────────────────────── */

function PagesTab({ store }: { store: Store }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          Manage your store&apos;s pages. Visit the Pages section for full page editing.
        </p>
      </CardContent>
    </Card>
  );
}
