"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Save, Eye, ArrowLeft, Calendar, Settings, Image as ImageIcon, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBlogPost, useCreateBlogPost, useUpdateBlogPost, useAutoSaveBlogPost, useBlogCategories, useBlogTags, useCreateBlogCategory, useCreateBlogTag } from "@/api/blog";
import { useStores } from "@/api/queries";
import { Button } from "@/shared/ui";
import { TiptapEditor } from "./editor";
import { BlogAIAssistant } from "./ai/blog-ai-assistant";
import { MediaPickerModal } from "../media/media-picker-modal";

interface BlogPostEditorProps {
  postId?: string;
}

export function BlogPostEditor({ postId }: BlogPostEditorProps) {
  const router = useRouter();
  const locale = useLocale();
  const { data: stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const store = stores?.find((s) => s.id === selectedStoreId) || stores?.[0];
  const isNew = !postId || postId === "new";

  const { data: existingPost, isLoading } = useBlogPost(isNew ? "" : postId || "");
  const { data: availableCategories } = useBlogCategories(store?.id);
  const { data: availableTags } = useBlogTags(store?.id);
  const createCategory = useCreateBlogCategory();
  const createTag = useCreateBlogTag();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const autoSave = useAutoSaveBlogPost();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled" | "archived">("draft");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showContentImagePicker, setShowContentImagePicker] = useState(false);
  const [pendingImageInsert, setPendingImageInsert] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    if (stores?.length && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  useEffect(() => {
    if (existingPost) {
      if (existingPost.store && stores?.length) {
        setSelectedStoreId(existingPost.store as string);
      }
      setTitle(existingPost.title);
      setSlug(existingPost.slug);
      setExcerpt(existingPost.excerpt);
      setContent(existingPost.content);
      setStatus(existingPost.status);
      setSelectedCategories(existingPost.categories || []);
      setSelectedTags(existingPost.tags || []);
      setFeaturedImage(existingPost.featured_image || null);
      setFeaturedImageUrl(existingPost.featured_image_url || null);
      setFeaturedImageAlt(existingPost.featured_image_alt || "");
      setSeoTitle(existingPost.seo_title);
      setSeoDescription(existingPost.seo_description);
    }
  }, [existingPost, stores]);

  useEffect(() => {
    if (isNew) return;
    const timer = setInterval(() => {
      if (hasUnsavedChanges && postId && postId !== "new") {
        autoSave.mutate({ id: postId, title, content });
        setHasUnsavedChanges(false);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [hasUnsavedChanges, postId, title, content, autoSave, isNew]);

  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !store?.id) return;
    const slug = generateSlug(newCategoryName);
    const result = await createCategory.mutateAsync({ store: store.id, name: newCategoryName, slug });
    setSelectedCategories([...selectedCategories, result.id]);
    setNewCategoryName("");
    setShowNewCategory(false);
    setHasUnsavedChanges(true);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !store?.id) return;
    const slug = generateSlug(newTagName);
    const result = await createTag.mutateAsync({ store: store.id, name: newTagName, slug });
    setSelectedTags([...selectedTags, result.id]);
    setNewTagName("");
    setShowNewTag(false);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNew || !existingPost?.slug) {
      setSlug(generateSlug(value));
    }
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!store?.id) return;
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const payload = {
      store: store.id,
      title,
      slug: slug || generateSlug(title),
      status,
      excerpt,
      content,
      categories: selectedCategories,
      tags: selectedTags,
      featured_image: featuredImage,
      featured_image_alt: featuredImageAlt,
      seo_title: seoTitle,
      seo_description: seoDescription,
    };

    if (isNew) {
      const newPost = await createPost.mutateAsync(payload);
      router.replace(`/${locale}/dashboard/blog/${newPost.id}`);
    } else if (postId) {
      await updatePost.mutateAsync({ id: postId, ...payload });
      setHasUnsavedChanges(false);
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/dashboard/blog`)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title..."
            className="flex-1 border-0 bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none"
          />
        </div>

        <input
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setHasUnsavedChanges(true); }}
          placeholder="post-slug"
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 focus:border-blue-500 focus:outline-none"
        />

        <textarea
          value={excerpt}
          onChange={(e) => { setExcerpt(e.target.value); setHasUnsavedChanges(true); }}
          placeholder="Write a brief excerpt..."
          rows={2}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:border-blue-500 focus:outline-none"
        />

        <TiptapEditor
          content={content}
          onChange={(html) => { setContent(html); setPendingImageInsert(null); setHasUnsavedChanges(true); }}
          placeholder="Start writing your post..."
          onImageInsert={() => setShowContentImagePicker(true)}
          pendingImageInsert={pendingImageInsert}
        />
      </div>

      <div className="w-80 space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Featured Image</h3>
          {featuredImageUrl ? (
            <div className="relative">
              <img
                src={featuredImageUrl}
                alt={featuredImageAlt || "Featured image"}
                className="w-full rounded-lg object-cover"
              />
              <button
                onClick={() => { setFeaturedImage(null); setFeaturedImageUrl(null); setFeaturedImageAlt(""); setHasUnsavedChanges(true); }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowMediaPicker(true)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Change Image
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowMediaPicker(true)}
              className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-gray-200 p-6 text-center hover:border-blue-300 hover:bg-blue-50/50"
            >
              <ImageIcon className="h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-600">Choose Image</p>
              <p className="mt-0.5 text-xs text-gray-400">or upload a new one</p>
            </button>
          )}
          {featuredImageUrl && (
            <div className="mt-2">
              <label className="mb-1 block text-xs text-gray-500">Alt Text</label>
              <input
                type="text"
                value={featuredImageAlt}
                onChange={(e) => { setFeaturedImageAlt(e.target.value); setHasUnsavedChanges(true); }}
                placeholder="Describe the image"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        <MediaPickerModal
          open={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(asset) => {
            setFeaturedImage(asset.id);
            setFeaturedImageUrl(asset.file_url);
            setHasUnsavedChanges(true);
          }}
          storeId={store?.id}
        />

        <MediaPickerModal
          open={showContentImagePicker}
          onClose={() => setShowContentImagePicker(false)}
          onSelect={(asset) => {
            setPendingImageInsert(asset.file_url);
            setHasUnsavedChanges(true);
          }}
          storeId={store?.id}
        />

        {stores && stores.length > 1 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label className="mb-2 block text-sm font-semibold text-gray-900">Store</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {!store && stores && stores.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">You need to create a store before writing blog posts.</p>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
          </div>
          <div className="space-y-2">
            <Button
              onClick={handleSave}
              disabled={createPost.isPending || updatePost.isPending || !store}
              className="w-full"
            >
              <Save className="me-2 h-4 w-4" />
              {isNew ? "Create Post" : "Save Changes"}
            </Button>
            {hasUnsavedChanges && (
              <p className="text-xs text-amber-600">Unsaved changes</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Status</h3>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published" | "scheduled" | "archived")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
            <button
              onClick={() => setShowNewCategory(!showNewCategory)}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {showNewCategory && (
            <div className="mb-2 flex gap-1.5">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateCategory(); }}
                autoFocus
              />
              <button
                onClick={handleCreateCategory}
                disabled={createCategory.isPending || !newCategoryName.trim()}
                className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
          {availableCategories && availableCategories.length > 0 ? (
            <div className="space-y-1">
              {availableCategories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={(e) => {
                      setSelectedCategories(
                        e.target.checked
                          ? [...selectedCategories, cat.id]
                          : selectedCategories.filter((id) => id !== cat.id)
                      );
                      setHasUnsavedChanges(true);
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">{cat.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">{showNewCategory ? "Type a name and click Add." : "No categories yet. Click + to create one."}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Tags</h3>
            <button
              onClick={() => setShowNewTag(!showNewTag)}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {showNewTag && (
            <div className="mb-2 flex gap-1.5">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateTag(); }}
                autoFocus
              />
              <button
                onClick={handleCreateTag}
                disabled={createTag.isPending || !newTagName.trim()}
                className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
          {availableTags && availableTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setSelectedTags(
                      selectedTags.includes(tag.id)
                        ? selectedTags.filter((id) => id !== tag.id)
                        : [...selectedTags, tag.id]
                    );
                    setHasUnsavedChanges(true);
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">{showNewTag ? "Type a name and click Add." : "No tags yet. Click + to create one."}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex w-full items-center justify-between text-sm font-semibold text-gray-900"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> SEO Settings
            </span>
          </button>
          {showSettings && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">SEO Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength={60}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">{seoTitle.length}/60</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Meta Description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">{seoDescription.length}/160</p>
              </div>
            </div>
          )}
        </div>

        {existingPost && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Stats</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Views</span>
                <span className="font-medium">{existingPost.view_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Reading time</span>
                <span className="font-medium">{existingPost.reading_time} min</span>
              </div>
              <div className="flex justify-between">
                <span>Comments</span>
                <span className="font-medium">{existingPost.comment_count}</span>
              </div>
            </div>
          </div>
        )}

        <BlogAIAssistant
          postId={isNew ? undefined : postId}
          postTitle={title}
          postContent={content}
          onApplyContent={(html) => { setContent(html); setHasUnsavedChanges(true); }}
          onApplyMetadata={(data) => {
            if (data.title) setTitle(data.title);
            if (data.excerpt) setExcerpt(data.excerpt);
            if (data.seo_title) setSeoTitle(data.seo_title);
            if (data.seo_description) setSeoDescription(data.seo_description);
            setHasUnsavedChanges(true);
          }}
        />
      </div>
    </div>
  );
}
