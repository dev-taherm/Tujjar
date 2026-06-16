"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Calendar, Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPostListItem } from "@/shared/types/blog";

interface BlogListResponse {
  posts: BlogPostListItem[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

async function fetchBlogPosts(
  slug: string,
  locale: string,
  page: number = 1,
  category?: string,
): Promise<BlogListResponse> {
  const params = new URLSearchParams({ locale, page: String(page) });
  if (category) params.set("category", category);
  const res = await fetch(`http://localhost:8000/api/v1/store/${slug}/blog/?${params}`);
  if (!res.ok) throw new Error("Failed to fetch blog posts");
  return res.json();
}

async function fetchBlogCategories(slug: string, locale: string) {
  const res = await fetch(`http://localhost:8000/api/v1/store/${slug}/blog/categories/?locale=${locale}`);
  if (!res.ok) return [];
  return res.json();
}

export default function StorefrontBlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const { slug, locale } = use(params);
  const { page: pageParam, category } = use(searchParams);
  const currentPage = Number(pageParam) || 1;

  const [blogData, setBlogData] = useState<BlogListResponse | null>(null);
  const [categories, setCategories] = useState<Array<{ name: string; slug: string; post_count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    (async () => {
      try {
        const [posts, cats] = await Promise.all([
          fetchBlogPosts(slug, locale, currentPage, category),
          fetchBlogCategories(slug, locale),
        ]);
        setBlogData(posts);
        setCategories(cats);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const posts = blogData?.posts || [];
  const pagination = blogData?.pagination;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Blog</h1>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/shop/${slug}/shop/blog`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !category ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/shop/${slug}/shop/blog?category=${cat.slug}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat.slug
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.name} ({cat.post_count})
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No blog posts yet.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/${locale}/shop/${slug}/shop/blog/${post.slug}`}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                {post.featured_image_url ? (
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-gray-300">
                    No image
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                    {post.author_name && <span>{post.author_name}</span>}
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.published_at).toLocaleDateString()}
                      </span>
                    )}
                    {post.reading_time > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.reading_time} min read
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {pagination.has_previous && (
                <Link
                  href={`/${locale}/shop/${slug}/shop/blog?page=${currentPage - 1}${category ? `&category=${category}` : ""}`}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              )}
              <span className="px-4 text-sm text-gray-500">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              {pagination.has_next && (
                <Link
                  href={`/${locale}/shop/${slug}/shop/blog?page=${currentPage + 1}${category ? `&category=${category}` : ""}`}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
