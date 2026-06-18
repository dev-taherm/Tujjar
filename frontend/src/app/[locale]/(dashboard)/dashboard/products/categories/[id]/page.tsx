"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { MediaPickerModal } from "@/features/media/media-picker-modal";
import { Button, Input, Textarea, Select, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { Toggle } from "@/shared/components/toggle";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import { useCategory, useUpdateCategory, useCategories, useStores } from "@/api/queries";
import type { Category } from "@/shared/types";
import { ArrowLeft, Save } from "lucide-react";
import { slugify } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { SerpPreview } from "@/features/products/serp-preview";

export default function CategoryDetailPage() {
  const t = useTranslations("dashboard.category");
  const tc = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  const { data: category, isLoading } = useCategory(categoryId);
  const { data: categories } = useCategories();
  const { data: stores } = useStores();
  const updateCategory = useUpdateCategory();

  const [editLocale, setEditLocale] = useState("en");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [initializedId, setInitializedId] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  if (category && category.id !== initializedId) {
    setInitializedId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description);
    setParentId(category.parent || "");
    setStoreId(category.store);
    setIsActive(category.is_active);
    setSeoTitle(category.seo_title || "");
    setSeoDescription(category.seo_description || "");
    setImage(category.image || "");
    setSortOrder(category.sort_order || 0);
  }

  const handleLocaleChange = useCallback(
    (newLocale: string) => {
      setEditLocale(newLocale);
      if (category) {
        if (newLocale === "en") {
          setName(category.name);
          setDescription(category.description);
        } else {
          const t = category.translations?.[newLocale];
          setName(t?.name || "");
          setDescription(t?.description || "");
        }
      }
    },
    [category]
  );

  const handleSave = async () => {
    if (!name && editLocale === "en") return;
    if (editLocale === "en") {
      await updateCategory.mutateAsync({
        id: categoryId,
        name,
        slug,
        description,
        seo_title: seoTitle || undefined,
        seo_description: seoDescription || undefined,
        parent: parentId || null,
        is_active: isActive,
        image: image || undefined,
        sort_order: sortOrder,
      } as { id: string } & Partial<Category>);
    } else {
      await updateCategory.mutateAsync({
        id: categoryId,
        translations: {
          ...category?.translations,
          [editLocale]: { name, description },
        },
      } as { id: string } & Partial<Category>);
    }
    router.back();
  };

  if (isLoading) {
    return <div className="h-[400px] animate-pulse rounded-xl bg-gray-200" />;
  }

  const parentOptions = [
    { value: "", label: t("noneTopLevel") },
    ...(categories || []).filter((c) => c.id !== categoryId).map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5 rtl:rotate-180" /></button>
          <h1 className="text-2xl font-bold text-gray-900">{t("edit")}</h1>
          <LocaleToggle value={editLocale} onChange={handleLocaleChange} />
        </div>
        <Button onClick={handleSave} isLoading={updateCategory.isPending}>
          <Save className="me-2 h-4 w-4" /> {tc("save")}
        </Button>
      </div>

      {editLocale !== "en" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          Editing {editLocale === "ar" ? "Arabic" : editLocale} translations. English values are used as fallback.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("details")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label={t("name")} value={name} onChange={(e) => { setName(e.target.value); if (editLocale === "en") setSlug(slugify(e.target.value)); }} />
            {editLocale === "en" && <Input label={t("slug")} value={slug} onChange={(e) => setSlug(e.target.value)} />}
            <Textarea label={t("description")} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={e => setSeoTitle(e.target.value)}
                maxLength={60}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{seoTitle.length}/60 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
              <textarea
                value={seoDescription}
                onChange={e => setSeoDescription(e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{seoDescription.length}/160 characters</p>
            </div>
            <SerpPreview title={seoTitle} description={seoDescription} url={`yoursite.com/categories/${slug}`} />
            {editLocale === "en" && (
              <>
                <Select label={t("parentCategory")} options={parentOptions} value={parentId} onChange={(e) => setParentId(e.target.value)} />
                <div>
                  <Toggle label={t("active")} enabled={isActive} onToggle={() => setIsActive(!isActive)} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Image</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
              {image ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <img src={image} alt="Category" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(true)}
                      className="rounded bg-white/80 px-2 py-1 text-xs hover:bg-white"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="rounded bg-white/80 px-2 py-1 text-xs text-red-600 hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-500"
                >
                  <span className="text-2xl">+</span>
                  <span className="text-sm">Upload Image</span>
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(asset) => {
          setImage(asset.file_url);
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
}
