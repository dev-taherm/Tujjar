"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { Toggle } from "@/shared/components/toggle";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import { useCollection, useUpdateCollection } from "@/api/queries";
import type { Collection } from "@/shared/types";
import { ArrowLeft, Save } from "lucide-react";
import { slugify } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function CollectionDetailPage() {
  const t = useTranslations("dashboard.collection");
  const tc = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const { data: collection, isLoading } = useCollection(collectionId);
  const updateCollection = useUpdateCollection();

  const [editLocale, setEditLocale] = useState("en");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [initializedId, setInitializedId] = useState("");

  if (collection && collection.id !== initializedId) {
    setInitializedId(collection.id);
    setName(collection.name);
    setSlug(collection.slug);
    setDescription(collection.description);
    setIsActive(collection.is_active);
  }

  const handleLocaleChange = useCallback(
    (newLocale: string) => {
      setEditLocale(newLocale);
      if (collection) {
        if (newLocale === "en") {
          setName(collection.name);
          setDescription(collection.description);
        } else {
          const tr = collection.translations?.[newLocale];
          setName(tr?.name || "");
          setDescription(tr?.description || "");
        }
      }
    },
    [collection]
  );

  const handleSave = async () => {
    if (!name && editLocale === "en") return;
    if (editLocale === "en") {
      await updateCollection.mutateAsync({
        id: collectionId,
        name,
        slug,
        description,
        is_active: isActive,
      } as { id: string } & Partial<Collection>);
    } else {
      await updateCollection.mutateAsync({
        id: collectionId,
        translations: {
          ...collection?.translations,
          [editLocale]: { name, description },
        },
      } as { id: string } & Partial<Collection>);
    }
    router.back();
  };

  if (isLoading) {
    return <div className="h-[400px] animate-pulse rounded-xl bg-gray-200" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5 rtl:rotate-180" /></button>
          <h1 className="text-2xl font-bold text-gray-900">{t("edit")}</h1>
          <LocaleToggle value={editLocale} onChange={handleLocaleChange} />
        </div>
        <Button onClick={handleSave} isLoading={updateCollection.isPending}>
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
            {editLocale === "en" && (
              <Toggle label={t("active")} enabled={isActive} onToggle={() => setIsActive(!isActive)} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
