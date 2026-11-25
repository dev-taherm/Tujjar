"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Plus, Search, FileText, Calendar, Eye, MessageSquare, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { useBlogPosts, useDeleteBlogPost, usePublishBlogPost, useUnpublishBlogPost, useSetBlogPostFeatured } from "@/api/blog";
import { useStores } from "@/api/queries";
import { Button } from "@/shared/ui";

export function BlogPostList() {
  const router = useRouter();
  const locale = useLocale();
  const { data: stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const effectiveStoreId = selectedStoreId || stores?.[0]?.id || "";

  const { data: posts, isLoading } = useBlogPosts({
    store: effectiveStoreId || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const deletePost = useDeleteBlogPost();
  const publishPost = usePublishBlogPost();
  const unpublishPost = useUnpublishBlogPost();
  const setFeatured = useSetBlogPostFeatured();

  const filteredPosts = posts || [];

  const handleCreate = () => {
    router.push(`/${locale}/dashboard/blog/new`);
  };

  const handleEdit = (id: string) => {
    router.push(`/${locale}/dashboard/blog/${id}`);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-rail text-ink",
      published: "bg-success-soft text-success",
      scheduled: "bg-primary-100 text-primary-700",
      archived: "bg-warning-soft text-warning",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {stores && stores.length > 1 && (
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="h-10 rounded-lg border border-line bg-panel px-3 text-sm focus:border-primary-500 focus:outline-none"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full sm:w-64 rounded-lg border border-line bg-panel ps-10 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-line bg-panel px-3 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="me-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 shimmer rounded-xl" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-line bg-panel p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-ink-soft" />
          <h3 className="mt-4 text-lg font-semibold text-ink">No posts yet</h3>
          <p className="mt-1 text-sm text-ink-soft">Create your first blog post to get started.</p>
          <Button onClick={handleCreate} className="mt-4">
            <Plus className="me-2 h-4 w-4" />
            Create Post
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="group flex items-center justify-between rounded-xl border border-line bg-panel p-4 transition-colors hover:border-line"
            >
              <div
                className="flex flex-1 cursor-pointer items-center gap-4"
                onClick={() => handleEdit(post.id)}
              >
                {post.featured_image_url ? (
                  <img
                    src={post.featured_image_url}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rail">
                    <FileText className="h-5 w-5 text-ink-soft" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{post.title}</h3>
                    {post.is_featured && <Star className="h-3.5 w-3.5 fill-yellow-400 text-warning" />}
                    {statusBadge(post.status)}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-ink-soft">
                    {post.author_name && <span>{post.author_name}</span>}
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.published_at).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.comment_count}
                    </span>
                    {post.reading_time > 0 && <span>{post.reading_time} min read</span>}
                  </div>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                  className="rounded-lg p-2 text-ink-soft hover:bg-rail hover:text-ink-soft"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenuId === post.id && (
                  <div className="absolute end-0 top-full z-10 mt-1 w-48 rounded-lg border border-line bg-panel py-1 shadow-lg">
                    {post.status !== "published" && (
                      <button
                        onClick={() => { publishPost.mutate(post.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-rail"
                      >
                        <Eye className="h-4 w-4" /> Publish
                      </button>
                    )}
                    {post.status === "published" && (
                      <button
                        onClick={() => { unpublishPost.mutate(post.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-rail"
                      >
                        <Eye className="h-4 w-4" /> Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => { setFeatured.mutate(post.id); setOpenMenuId(null); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-rail"
                    >
                      <Star className="h-4 w-4" /> {post.is_featured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      onClick={() => { handleEdit(post.id); setOpenMenuId(null); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-rail"
                    >
                      <FileText className="h-4 w-4" /> Edit
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => { deletePost.mutate(post.id); setOpenMenuId(null); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error-soft"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
