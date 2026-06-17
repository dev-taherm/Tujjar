"use client";

import { useState } from "react";
import { FolderOpen, Plus, Pencil, Trash2, X } from "lucide-react";
import { useBlogCategories, useCreateBlogCategory, useUpdateBlogCategory, useDeleteBlogCategory } from "@/api/blog";
import { useStores } from "@/api/queries";
import { Button } from "@/shared/ui";
import type { BlogCategory } from "@/shared/types/blog";

export function BlogCategoryManager() {
  const { data: stores } = useStores();
  const store = stores?.[0];
  const { data: categories, isLoading } = useBlogCategories(store?.id);
  const createCategory = useCreateBlogCategory();
  const updateCategory = useUpdateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const generateSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (cat: BlogCategory) => {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !store?.id) return;
    const payload = {
      store: store.id,
      name,
      slug: slug || generateSlug(name),
      description,
    };

    if (editing) {
      await updateCategory.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createCategory.mutateAsync(payload);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteCategory.mutateAsync(id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Organize your posts into categories.</p>
        <Button
          onClick={() => { resetForm(); setShowForm(true); }}
          size="sm"
        >
          <Plus className="me-1.5 h-4 w-4" />
          New Category
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {editing ? "Edit Category" : "New Category"}
            </h3>
            <button onClick={resetForm} className="rounded p-1 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (!editing) setSlug(generateSlug(e.target.value)); }}
                placeholder="Category name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="category-slug"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={createCategory.isPending || updateCategory.isPending || !name.trim()}
              >
                {editing ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first category to organize posts.</p>
          <Button onClick={() => setShowForm(true)} className="mt-4" size="sm">
            <Plus className="me-1.5 h-4 w-4" />
            Create Category
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{cat.name}</h4>
                  <span className="text-xs text-gray-400">/{cat.slug}</span>
                </div>
                {cat.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-1">{cat.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">{cat.post_count} posts</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(cat)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {confirmDelete === cat.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(cat.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
