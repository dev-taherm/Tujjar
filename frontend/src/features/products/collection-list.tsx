"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Dialog, Input, EmptyState } from "@/shared/ui";
import { slugify } from "@/lib/utils";
import { useCollections, useCreateCollection, useDeleteCollection } from "@/api/queries";
import type { Collection } from "@/shared/types";
import { Plus, Layers, Trash2, Edit } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

export function CollectionList() {
  const t = useTranslations("dashboard.products");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { data: collections, isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const handleCreate = async () => {
    if (!newName || !newSlug) return;
    await createCollection.mutateAsync({ name: newName, slug: newSlug } as Partial<Collection>);
    setShowCreate(false);
    setNewName("");
    setNewSlug("");
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("deleteCollectionConfirm"))) {
      await deleteCollection.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />)}</div>;
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t("collections")}</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="me-2 h-4 w-4" /> {t("addCollection")}
        </Button>
      </div>

      {!collections?.length ? (
        <EmptyState
          icon={Layers}
          title={t("noCollections")}
          description={t("createCollectionsToGroup")}
          action={<Button onClick={() => setShowCreate(true)}><Plus className="me-2 h-4 w-4" /> {t("addCollection")}</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Card key={col.id} className="group cursor-pointer transition-all hover:shadow-md" onClick={() => router.push(`/${locale}/dashboard/products/collections/${col.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900">{col.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/dashboard/products/collections/${col.id}`); }} className="rounded p-1 hover:bg-gray-200"><Edit className="h-3.5 w-3.5 text-gray-500" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(col.id); }} className="rounded p-1 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                  </div>
                </div>
                {col.description && <p className="mb-2 text-sm text-gray-500 line-clamp-2">{col.description}</p>}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{col.product_count} {t("totalProducts").toLowerCase()}</span>
                  <span>{formatDateTime(col.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title={t("createCollection")}>
        <div className="space-y-4">
          <Input label={tc("add")} value={newName} onChange={(e) => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }} />
          <Input label={t("slug")} value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowCreate(false)}>{tc("cancel")}</Button>
          <Button onClick={handleCreate} isLoading={createCollection.isPending}>{tc("create")}</Button>
        </div>
      </Dialog>
    </>
  );
}
