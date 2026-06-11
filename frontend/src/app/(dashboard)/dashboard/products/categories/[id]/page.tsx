"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button, Input, Textarea, Select, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { useCategory, useUpdateCategory, useCategories, useStores } from "@/api/queries";
import { ArrowLeft, Save } from "lucide-react";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  const { data: category, isLoading } = useCategory(categoryId);
  const { data: categories } = useCategories();
  const { data: stores } = useStores();
  const updateCategory = useUpdateCategory();

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

  const handleSave = async () => {
    if (!name || !slug) return;
    await updateCategory.mutateAsync({
      id: categoryId,
      name,
      slug,
      description,
      parent: parentId || null,
      is_active: isActive,
    } as any);
    router.back();
  };

  if (isLoading) {
    return <div className="h-[400px] animate-pulse rounded-xl bg-gray-200" />;
  }

  const parentOptions = [
    { value: "", label: "None (Top Level)" },
    ...(categories || []).filter((c) => c.id !== categoryId).map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
        </div>
        <Button onClick={handleSave} isLoading={updateCategory.isPending}>
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
            <Select label="Parent Category" options={parentOptions} value={parentId} onChange={(e) => setParentId(e.target.value)} />
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
