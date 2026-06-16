"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BlogPostEditor } from "@/features/blog/blog-post-editor";
import { useBlogPost } from "@/api/blog";

export default function BlogPostDetailPage() {
  const params = useParams();
  const t = useTranslations("dashboard.blog");
  const id = params.id as string;
  const { data: post, isLoading } = useBlogPost(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{post?.title || t("editor.newPost")}</h1>
        <p className="text-sm text-gray-500">
          {post?.status === "published" ? t("editor.published") : t("editor.draft")}
          {post?.reading_time ? ` · ${post.reading_time} min read` : ""}
        </p>
      </div>
      <BlogPostEditor postId={id} />
    </div>
  );
}
