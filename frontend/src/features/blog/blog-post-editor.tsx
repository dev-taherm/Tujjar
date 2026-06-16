"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Save, Eye, ArrowLeft, Calendar, Settings } from "lucide-react";
import { toast } from "sonner";
import { useBlogPost, useCreateBlogPost, useUpdateBlogPost, useAutoSaveBlogPost } from "@/api/blog";
import { useStores } from "@/api/queries";
import { Button } from "@/shared/ui";
import { TiptapEditor } from "./editor";
import { BlogAIAssistant } from "./ai/blog-ai-assistant";

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
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const autoSave = useAutoSaveBlogPost();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled" | "archived">("draft");
  const [showSettings, setShowSettings] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
          onChange={(html) => { setContent(html); setHasUnsavedChanges(true); }}
          placeholder="Start writing your post..."
        />
      </div>

      <div className="w-80 space-y-4">
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
