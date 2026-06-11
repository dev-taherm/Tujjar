"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { useCollection, useUpdateCollection } from "@/api/queries";
import { ArrowLeft, Save } from "lucide-react";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const { data: collection, isLoading } = useCollection(collectionId);
  const updateCollection = useUpdateCollection();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setSlug(collection.slug);
      setDescription(collection.description);
      setIsActive(collection.is_active);
    }
  }, [collection]);

  const handleSave = async () => {
    if (!name || !slug) return;
    await updateCollection.mutateAsync({
      id: collectionId,
      name,
      slug,
      description,
      is_active: isActive,
    } as any);
    router.back();
  };

  if (isLoading) {
    return <div className="h-[400px] animate-pulse rounded-xl bg-gray-200" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Collection</h1>
        </div>
        <Button onClick={handleSave} isLoading={updateCollection.isPending}>
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Name" value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} />
            <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Active</label>
              <button onClick={() => setIsActive(!isActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-blue-600" : "bg-gray-200"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
