"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Toggle } from "@/shared/components/toggle";
import { useBlogSettings, useSaveBlogSettings, type BlogSettingsData } from "@/api/blog";

interface BlogSettingsProps {
  storeId: string;
}

const defaults: Omit<BlogSettingsData, "id" | "organization" | "store" | "created_at" | "updated_at"> = {
  posts_per_page: 10,
  default_status: "draft",
  allow_comments: true,
  comment_moderation: true,
  show_author_bio: true,
  rss_enabled: true,
};

export function BlogSettings({ storeId }: BlogSettingsProps) {
  const { data: settings, isLoading } = useBlogSettings(storeId);
  const saveMutation = useSaveBlogSettings();
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});

  const form = {
    posts_per_page: (overrides.posts_per_page as number) ?? settings?.posts_per_page ?? defaults.posts_per_page,
    default_status: (overrides.default_status as "draft" | "published") ?? settings?.default_status ?? defaults.default_status,
    allow_comments: (overrides.allow_comments as boolean) ?? settings?.allow_comments ?? defaults.allow_comments,
    comment_moderation: (overrides.comment_moderation as boolean) ?? settings?.comment_moderation ?? defaults.comment_moderation,
    show_author_bio: (overrides.show_author_bio as boolean) ?? settings?.show_author_bio ?? defaults.show_author_bio,
    rss_enabled: (overrides.rss_enabled as boolean) ?? settings?.rss_enabled ?? defaults.rss_enabled,
  };

  const updateForm = (key: string, value: unknown) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ storeId, payload: form });
      toast.success("Settings saved");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to save settings", { description: message });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Blog Settings</h3>

        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="posts_per_page" className="mb-1 block text-sm font-medium text-gray-700">
                Posts per page
              </label>
              <input
                id="posts_per_page"
                type="number"
                min={1}
                max={100}
                value={form.posts_per_page}
                onChange={(e) =>
                  updateForm("posts_per_page", Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="default_status" className="mb-1 block text-sm font-medium text-gray-700">
                Default post status
              </label>
              <select
                id="default_status"
                value={form.default_status}
                onChange={(e) =>
                  updateForm("default_status", e.target.value as "draft" | "published")
                }
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <Toggle
              enabled={form.allow_comments}
              onToggle={() => updateForm("allow_comments", !form.allow_comments)}
              label="Allow comments"
              description="Visitors can leave comments on blog posts"
            />
            <Toggle
              enabled={form.comment_moderation}
              onToggle={() => updateForm("comment_moderation", !form.comment_moderation)}
              label="Comment moderation"
              description="New comments require approval before appearing"
            />
            <Toggle
              enabled={form.show_author_bio}
              onToggle={() => updateForm("show_author_bio", !form.show_author_bio)}
              label="Show author bio"
              description="Display author information below blog posts"
            />
            <Toggle
              enabled={form.rss_enabled}
              onToggle={() => updateForm("rss_enabled", !form.rss_enabled)}
              label="RSS feed enabled"
              description="Allow visitors to subscribe via RSS"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
