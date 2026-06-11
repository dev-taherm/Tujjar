"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/shared/ui";
import { useCollections, useCreateCollection, useDeleteCollection } from "@/api/queries";
import { Plus, Layers, Trash2, Edit } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export function CollectionList() {
  const router = useRouter();
  const { data: collections, isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const handleCreate = async () => {
    if (!newName || !newSlug) return;
    await createCollection.mutateAsync({ name: newName, slug: newSlug } as any);
    setShowCreate(false);
    setNewName("");
    setNewSlug("");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this collection? Products will be unlinked.")) {
      await deleteCollection.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />)}</div>;
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Collection
        </Button>
      </div>

      {!collections?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16">
          <Layers className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No collections yet</h3>
          <p className="mb-6 text-sm text-gray-500">Create collections to group your products.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Collection
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Card key={col.id} className="group cursor-pointer transition-all hover:shadow-md" onClick={() => router.push(`/dashboard/products/collections/${col.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900">{col.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/products/collections/${col.id}`); }} className="rounded p-1 hover:bg-gray-200"><Edit className="h-3.5 w-3.5 text-gray-500" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(col.id); }} className="rounded p-1 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                  </div>
                </div>
                {col.description && <p className="mb-2 text-sm text-gray-500 line-clamp-2">{col.description}</p>}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{col.product_count} products</span>
                  <span>{formatDateTime(col.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Create Collection</h2>
              <div className="space-y-4">
                <Input label="Name" value={newName} onChange={(e) => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} />
                <Input label="Slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} isLoading={createCollection.isPending}>Create</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
