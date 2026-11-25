"use client";

import { useState } from "react";
import { Tags, Plus, Pencil, Trash2, X } from "lucide-react";
import { useBlogTags, useCreateBlogTag, useUpdateBlogTag, useDeleteBlogTag } from "@/api/blog";
import { useStores } from "@/api/queries";
import { Button } from "@/shared/ui";
import type { BlogTag } from "@/shared/types/blog";

export function BlogTagManager() {
  const { data: stores } = useStores();
  const store = stores?.[0];
  const { data: tags, isLoading } = useBlogTags(store?.id);
  const createTag = useCreateBlogTag();
  const updateTag = useUpdateBlogTag();
  const deleteTag = useDeleteBlogTag();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogTag | null>(null);
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

  const handleEdit = (tag: BlogTag) => {
    setEditing(tag);
    setName(tag.name);
    setSlug(tag.slug);
    setDescription(tag.description || "");
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
      await updateTag.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createTag.mutateAsync(payload);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteTag.mutateAsync(id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">Add tags to improve post discoverability.</p>
        <Button
          onClick={() => { resetForm(); setShowForm(true); }}
          size="sm"
        >
          <Plus className="me-1.5 h-4 w-4" />
          New Tag
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              {editing ? "Edit Tag" : "New Tag"}
            </h3>
            <button onClick={resetForm} className="rounded p-1 text-ink-soft hover:text-ink-soft">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (!editing) setSlug(generateSlug(e.target.value)); }}
                placeholder="Tag name"
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="tag-slug"
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={createTag.isPending || updateTag.isPending || !name.trim()}
              >
                {editing ? "Save Changes" : "Create Tag"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 shimmer rounded-xl" />
          ))}
        </div>
      ) : !tags || tags.length === 0 ? (
        <div className="rounded-xl border border-line bg-panel p-12 text-center">
          <Tags className="mx-auto h-12 w-12 text-ink-soft" />
          <h3 className="mt-4 text-lg font-semibold text-ink">No tags</h3>
          <p className="mt-1 text-sm text-ink-soft">Create your first tag to label posts.</p>
          <Button onClick={() => setShowForm(true)} className="mt-4" size="sm">
            <Plus className="me-1.5 h-4 w-4" />
            Create Tag
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2"
            >
              <span className="text-sm text-ink">{tag.name}</span>
              <span className="text-xs text-ink-soft">({tag.post_count})</span>
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleEdit(tag)}
                  className="rounded p-0.5 text-ink-soft hover:text-ink-soft"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {confirmDelete === tag.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="rounded bg-error px-1.5 py-0.5 text-[10px] text-white hover:bg-error"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded bg-rail px-1.5 py-0.5 text-[10px] text-ink-soft hover:bg-rail"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(tag.id)}
                    className="rounded p-0.5 text-ink-soft hover:text-error"
                  >
                    <Trash2 className="h-3 w-3" />
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
