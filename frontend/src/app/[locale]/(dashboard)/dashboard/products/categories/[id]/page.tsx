"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button, Input, Textarea, Select, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import { useCategory, useUpdateCategory, useCategories, useStores } from "@/api/queries";
import { ArrowLeft, Save } from "lucide-react";
import { useTranslations } from "next-intl";

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

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description);
      setParentId(category.parent || "");
      setStoreId(category.store);
      setIsActive(category.is_active);
    }
  }, [category]);

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
        parent: parentId || null,
        is_active: isActive,
      } as any);
    } else {
      await updateCategory.mutateAsync({
        id: categoryId,
        translations: {
          ...category?.translations,
          [editLocale]: { name, description },
        },
      } as any);
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
          <h1 className="text-2xl font-bold text-gray-900">{t("editCategory")}</h1>
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
            <Input label={t("name")} value={name} onChange={(e) => { setName(e.target.value); if (editLocale === "en") setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} />
            {editLocale === "en" && <Input label={t("slug")} value={slug} onChange={(e) => setSlug(e.target.value)} />}
            <Textarea label={t("description")} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            {editLocale === "en" && (
              <>
                <Select label={t("parentCategory")} options={parentOptions} value={parentId} onChange={(e) => setParentId(e.target.value)} />
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">{t("active")}</label>
                  <button onClick={() => setIsActive(!isActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-blue-600" : "bg-gray-200"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
