"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Tags, FolderOpen, MessageSquare, Settings } from "lucide-react";
import { BlogPostList } from "@/features/blog/blog-post-list";
import { BlogCategoryManager } from "@/features/blog/blog-category-manager";
import { BlogTagManager } from "@/features/blog/blog-tag-manager";
import { BlogCommentManager } from "@/features/blog/blog-comment-manager";
import { BlogSettings } from "@/features/blog/blog-settings";
import { useStores } from "@/api/queries";

type Tab = "posts" | "categories" | "tags" | "comments" | "settings";

export default function BlogPage() {
  const t = useTranslations("dashboard.blog");
  const [tab, setTab] = useState<Tab>("posts");
  const { data: stores } = useStores();
  const storeId = stores?.[0]?.id;

  const tabs = [
    { key: "posts" as Tab, label: t("tabs.posts"), icon: FileText },
    { key: "categories" as Tab, label: t("tabs.categories"), icon: FolderOpen },
    { key: "tags" as Tab, label: t("tabs.tags"), icon: Tags },
    { key: "comments" as Tab, label: t("tabs.comments"), icon: MessageSquare },
    { key: "settings" as Tab, label: t("tabs.settings"), icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("description")}</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "posts" && <BlogPostList />}
      {tab === "categories" && <BlogCategoryManager />}
      {tab === "tags" && <BlogTagManager />}
      {tab === "comments" && <BlogCommentManager />}
      {tab === "settings" && storeId && <BlogSettings storeId={storeId} />}
    </div>
  );
}
