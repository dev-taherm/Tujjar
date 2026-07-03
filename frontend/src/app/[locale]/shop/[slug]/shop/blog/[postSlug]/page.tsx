"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Calendar, Clock, Eye, ArrowLeft, Tag, ChevronRight } from "lucide-react";
import { customerClient } from "@/api/customer-client";

interface StorefrontBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  featured_image_alt: string;
  author: { name: string; slug: string; bio: string; avatar_url: string | null } | null;
  published_at: string | null;
  reading_time: number;
  view_count: number;
  seo_title: string;
  seo_description: string;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  allow_comments: boolean;
  is_featured: boolean;
}

async function fetchBlogPost(slug: string, postSlug: string, locale: string): Promise<StorefrontBlogPost> {
  const { data } = await customerClient.get(`/store/${slug}/blog/${postSlug}/`, { params: { locale } });
  return data;
}

async function fetchComments(postId: string): Promise<unknown[]> {
  try {
    const { data } = await customerClient.get(`/blog/posts/${postId}/public-comment/`);
    return data;
  } catch {
    return [];
  }
}

async function submitComment(
  postId: string,
  data: { content: string; author_name?: string; author_email?: string },
): Promise<void> {
  await customerClient.post(`/blog/posts/${postId}/public-comment/`, data);
}

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  try {
    const DOMPurify = require("dompurify");
    return DOMPurify.default.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "div", "span", "hr"],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"],
    });
  } catch {
    return html;
  }
}

export default function StorefrontBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  const { slug, postSlug } = use(params);
  const locale = useLocale();
  const [post, setPost] = useState<StorefrontBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBlogPost(slug, postSlug, locale);
        setPost(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, postSlug, locale]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentContent.trim()) return;
    setCommentSubmitting(true);
    try {
      await submitComment(post.id, {
        content: commentContent,
        author_name: commentName,
        author_email: commentEmail,
      });
      setCommentContent("");
      setCommentName("");
      setCommentEmail("");
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Post not found</h1>
        <Link
          href={`/${locale}/shop/${slug}/shop/blog`}
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href={`/${locale}/shop/${slug}/shop/blog`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>

      {post.categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/shop/${slug}/shop/blog?category=${cat.slug}`}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      <h1 className="mb-4 text-3xl font-bold text-gray-900">{post.title}</h1>

      <div className="mb-8 flex items-center gap-4 text-sm text-gray-500">
        {post.author && (
          <div className="flex items-center gap-2">
            {post.author.avatar_url ? (
              <img src={post.author.avatar_url} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                {post.author.name.charAt(0)}
              </div>
            )}
            <span>{post.author.name}</span>
          </div>
        )}
        {post.published_at && (
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(post.published_at).toLocaleDateString()}
          </span>
        )}
        {post.reading_time > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.reading_time} min read
          </span>
        )}
      </div>

      {post.featured_image_url && (
        <img
          src={post.featured_image_url}
          alt={post.featured_image_alt || post.title}
          className="mb-8 w-full rounded-xl object-cover"
          style={{ maxHeight: "400px" }}
        />
      )}

      {post.excerpt && (
        <p className="mb-6 text-lg text-gray-600 italic">{post.excerpt}</p>
      )}

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
      />

      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />
          {post.tags.map((tag) => (
            <span
              key={tag.slug}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {post.allow_comments && (
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Leave a comment</h2>

          {commentSuccess && (
            <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              Your comment has been submitted and is awaiting moderation.
            </div>
          )}

          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Your name"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                required
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Your email"
                value={commentEmail}
                onChange={(e) => setCommentEmail(e.target.value)}
                required
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <textarea
              placeholder="Write your comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={commentSubmitting || !commentContent.trim()}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {commentSubmitting ? "Submitting..." : "Submit Comment"}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
