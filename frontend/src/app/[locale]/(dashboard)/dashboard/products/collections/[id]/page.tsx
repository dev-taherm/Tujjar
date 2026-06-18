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
import { MediaPickerModal } from "@/features/media/media-picker-modal";
import { SerpPreview } from "@/features/products/serp-preview";
import { useProducts } from "@/api/products";
import type { Product } from "@/shared/types";

export default function CollectionDetailPage() {
  const t = useTranslations("dashboard.collection");
  const tc = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const { data: collection, isLoading } = useCollection(collectionId);
  const updateCollection = useUpdateCollection();
  const { data: allProducts = [] } = useProducts();

  const [editLocale, setEditLocale] = useState("en");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [initializedId, setInitializedId] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  if (collection && collection.id !== initializedId) {
    setInitializedId(collection.id);
    setName(collection.name);
    setSlug(collection.slug);
    setDescription(collection.description);
    setIsActive(collection.is_active);
    setSeoTitle(collection.seo_title || "");
    setSeoDescription(collection.seo_description || "");
    setImage(collection.image || "");
    setSortOrder(collection.sort_order || 0);
    setSelectedProductIds(collection.products?.map(p => p.id) || []);
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
        seo_title: seoTitle || undefined,
        seo_description: seoDescription || undefined,
        is_active: isActive,
        image: image || undefined,
        sort_order: sortOrder,
        product_ids: selectedProductIds,
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
            <SerpPreview title={seoTitle} description={seoDescription} url={`yoursite.com/collections/${slug}`} />
            {editLocale === "en" && (
              <Toggle label={t("active")} enabled={isActive} onToggle={() => setIsActive(!isActive)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Media & Products</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Image</label>
              {image ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <img src={image} alt="Collection" className="w-full h-full object-cover" />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Products in Collection ({selectedProductIds.length} selected)</label>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {allProducts.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">No products available.</p>
                ) : (
                  allProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(prev => [...prev, product.id]);
                          } else {
                            setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{product.title}</span>
                      <span className="ml-auto text-xs text-gray-400">{product.price}</span>
                    </label>
                  ))
                )}
              </div>
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
