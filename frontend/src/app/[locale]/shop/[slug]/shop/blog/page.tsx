import Link from "next/link";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  getStore,
  getStoreBlogCategories,
  getStoreBlogPosts,
  storefrontUrl,
} from "@/lib/server/storefront-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const store = await getStore(slug, locale);
  const title = store ? `${store.name} — Blog` : "Blog";
  return {
    title,
    description: store?.seo_description || store?.description || "",
    alternates: { canonical: storefrontUrl(slug, "shop/blog", locale) },
  };
}

export default async function StorefrontBlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam, category } = await searchParams;
  const locale = await getLocale();
  const currentPage = Number(pageParam) || 1;

  const [blogData, categories, store] = await Promise.all([
    getStoreBlogPosts(slug, locale, { page: currentPage, category }),
    getStoreBlogCategories(slug, locale),
    getStore(slug, locale),
  ]);

  const posts = blogData?.posts || [];
  const pagination = blogData?.pagination;
  const blogBase = `/${locale}/shop/${slug}/shop/blog`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold" style={{ color: "var(--color-text)" }}>Blog</h1>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={blogBase}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !category ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`${blogBase}?category=${cat.slug}`}
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
        <div className="rounded-xl border border-dashed p-12 text-center" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          No blog posts yet.
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`${blogBase}/${post.slug}`}
                className="group overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
              >
                <div className="h-48 w-full overflow-hidden" style={{ background: "var(--color-bg)" }}>
                  {post.featured_image_url ? (
                    <img
                      src={post.featured_image_url}
                      alt={post.featured_image_alt || post.title}
                      width={600}
                      height={400}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
                      No image
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {(post.author?.name || post.author_name) && <span>{post.author?.name || post.author_name}</span>}
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.published_at).toLocaleDateString(locale)}
                      </span>
                    )}
                    {post.reading_time ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.reading_time} min read
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {pagination.has_previous && (
                <Link
                  href={`${blogBase}?page=${currentPage - 1}${category ? `&category=${category}` : ""}`}
                  className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              )}
              <span className="px-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Page {pagination.page} of {pagination.total_pages}
              </span>
              {pagination.has_next && (
                <Link
                  href={`${blogBase}?page=${currentPage + 1}${category ? `&category=${category}` : ""}`}
                  className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
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
