import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import sanitize from "sanitize-html";
import { BlogComments } from "@/features/storefront/blog-comments";
import {
  getStore,
  getStoreBlogPost,
  storefrontUrl,
} from "@/lib/server/storefront-api";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "code", "pre", "img", "figure", "figcaption", "table", "thead",
  "tbody", "tr", "th", "td", "div", "span", "hr",
];
const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "target", "rel"];

/**
 * Server-side sanitization of stored merchant content. `sanitize-html` is
 * pure JS (no DOM/jsdom), so the server bundle stays lean and the build
 * works on every Node version. Links are forced to noopener/noreferrer.
 */
function sanitizeHtml(html: string): string {
  try {
    return sanitize(html, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: { "*": ALLOWED_ATTR },
      allowedSchemes: ["http", "https", "mailto"],
      allowedSchemesByTag: { img: ["http", "https", "data"] },
      allowProtocolRelative: false,
      transformTags: {
        a: (tagName, attribs) => ({
          tagName,
          attribs: { ...attribs, rel: "noopener noreferrer" },
        }),
      },
    });
  } catch {
    return html;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}): Promise<Metadata> {
  const { slug, postSlug } = await params;
  const locale = await getLocale();
  const post = await getStoreBlogPost(slug, postSlug, locale);
  if (!post) return {};

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || "";
  const images = post.featured_image_url ? [post.featured_image_url] : [];
  const publishedTime = post.published_at || undefined;

  return {
    title: post.seo_title ? { absolute: post.seo_title } : title,
    description,
    alternates: { canonical: storefrontUrl(slug, `shop/blog/${postSlug}`, locale) },
    openGraph: {
      title,
      description,
      url: storefrontUrl(slug, `shop/blog/${postSlug}`, locale),
      images,
      type: "article",
      publishedTime,
      authors: post.author?.name ? [post.author.name] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function StorefrontBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  const { slug, postSlug } = await params;
  const locale = await getLocale();

  const [post, store] = await Promise.all([
    getStoreBlogPost(slug, postSlug, locale),
    getStore(slug, locale),
  ]);

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Post not found</h1>
        <Link
          href={`/${locale}/shop/${slug}/shop/blog`}
          className="mt-4 inline-flex items-center gap-2"
          style={{ color: "var(--color-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>
      </div>
    );
  }

  const postUrl = storefrontUrl(slug, `shop/blog/${postSlug}`, locale);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description || post.excerpt || "",
    image: post.featured_image_url ? [post.featured_image_url] : undefined,
    datePublished: post.published_at || undefined,
    author: post.author?.name
      ? { "@type": "Person", name: post.author.name }
      : undefined,
    publisher: store ? { "@type": "Organization", name: store.name } : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <Link
        href={`/${locale}/shop/${slug}/shop/blog`}
        className="mb-6 inline-flex items-center gap-2 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>

      {post.categories && post.categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/shop/${slug}/shop/blog?category=${cat.slug}`}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "var(--color-surface)", color: "var(--color-primary)" }}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      <h1 className="mb-4 text-3xl font-bold" style={{ color: "var(--color-text)" }}>{post.title}</h1>

      <div className="mb-8 flex items-center gap-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {post.author && (
          <div className="flex items-center gap-2">
            {post.author.avatar_url ? (
              <img src={post.author.avatar_url} alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium"
                style={{ background: "var(--color-surface)", color: "var(--color-text)" }}
              >
                {post.author.name.charAt(0)}
              </div>
            )}
            <span>{post.author.name}</span>
          </div>
        )}
        {post.published_at && (
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(post.published_at).toLocaleDateString(locale)}
          </span>
        )}
        {post.reading_time ? (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.reading_time} min read
          </span>
        ) : null}
      </div>

      {post.featured_image_url && (
        <img
          src={post.featured_image_url}
          alt={post.featured_image_alt || post.title}
          width={800}
          height={400}
          fetchPriority="high"
          className="mb-8 w-full rounded-xl object-cover"
          style={{ maxHeight: "400px" }}
        />
      )}

      {post.excerpt && (
        <p className="mb-6 text-lg italic" style={{ color: "var(--color-text-secondary)" }}>{post.excerpt}</p>
      )}

      <div
        className="prose-tujjar max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || "") }}
      />

      {post.tags && post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
          {post.tags.map((tag) => (
            <span
              key={tag.slug}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {post.allow_comments && <BlogComments postId={post.id} />}
    </article>
  );
}
