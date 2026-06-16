"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Plus, Search, FileText, Calendar, Eye, MessageSquare, MoreHorizontal, Star, Archive, Trash2 } from "lucide-react";
import { useBlogPosts, useDeleteBlogPost, usePublishBlogPost, useUnpublishBlogPost, useSetBlogPostFeatured } from "@/api/blog";
import { useStores } from "@/api/queries";
import { Button } from "@/shared/ui";
import type { BlogPostListItem } from "@/shared/types/blog";

export function BlogPostList() {
  const router = useRouter();
  const locale = useLocale();
  const { data: stores } = useStores();
  const store = stores?.[0];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: posts, isLoading } = useBlogPosts({
    store: store?.id,
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
      draft: "bg-gray-100 text-gray-700",
      published: "bg-green-100 text-green-700",
      scheduled: "bg-blue-100 text-blue-700",
      archived: "bg-yellow-100 text-yellow-700",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 rounded-lg border border-gray-200 bg-white ps-10 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
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
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No posts yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first blog post to get started.</p>
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
              className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300"
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{post.title}</h3>
                    {post.is_featured && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                    {statusBadge(post.status)}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
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
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenuId === post.id && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {post.status !== "published" && (
                      <button
                        onClick={() => { publishPost.mutate(post.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" /> Publish
                      </button>
                    )}
                    {post.status === "published" && (
                      <button
                        onClick={() => { unpublishPost.mutate(post.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" /> Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => { setFeatured.mutate(post.id); setOpenMenuId(null); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Star className="h-4 w-4" /> {post.is_featured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      onClick={() => { handleEdit(post.id); setOpenMenuId(null); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4" /> Edit
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => { deletePost.mutate(post.id); setOpenMenuId(null); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
