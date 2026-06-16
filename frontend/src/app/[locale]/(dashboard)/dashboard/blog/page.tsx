"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Tags, FolderOpen, MessageSquare, Settings } from "lucide-react";
import { BlogPostList } from "@/features/blog/blog-post-list";
import { BlogCommentManager } from "@/features/blog/blog-comment-manager";

type Tab = "posts" | "categories" | "tags" | "comments" | "settings";

export default function BlogPage() {
  const t = useTranslations("dashboard.blog");
  const [tab, setTab] = useState<Tab>("posts");

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
      {tab === "categories" && <BlogCategoryList />}
      {tab === "tags" && <BlogTagList />}
      {tab === "comments" && <BlogCommentManager />}
      {tab === "settings" && <BlogSettings />}
    </div>
  );
}

function BlogCategoryList() {
  const t = useTranslations("dashboard.blog");
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">{t("categories.title")}</h3>
      <p className="mt-1 text-sm text-gray-500">{t("categories.description")}</p>
    </div>
  );
}

function BlogTagList() {
  const t = useTranslations("dashboard.blog");
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">{t("tags.title")}</h3>
      <p className="mt-1 text-sm text-gray-500">{t("tags.description")}</p>
    </div>
  );
}

function BlogCommentList() {
  const t = useTranslations("dashboard.blog");
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">{t("comments.title")}</h3>
      <p className="mt-1 text-sm text-gray-500">{t("comments.description")}</p>
    </div>
  );
}

function BlogSettings() {
  const t = useTranslations("dashboard.blog");
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">{t("settings.title")}</h3>
      <p className="mt-1 text-sm text-gray-500">{t("settings.description")}</p>
    </div>
  );
}
