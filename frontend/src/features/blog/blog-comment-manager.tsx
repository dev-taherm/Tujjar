"use client";

import { useState } from "react";
import { MessageSquare, Check, Trash2, AlertTriangle, CheckCircle, User } from "lucide-react";
import { useBlogComments, useApproveBlogComment, useRejectBlogComment, useTrashBlogComment, useApproveAllBlogComments } from "@/api/blog";
import { useStores } from "@/api/queries";
import type { BlogComment } from "@/shared/types/blog";

type CommentStatus = "pending" | "approved" | "spam" | "trash";

export function BlogCommentManager() {
  const { data: stores } = useStores();
  const store = stores?.[0];
  const [statusFilter, setStatusFilter] = useState<CommentStatus | "all">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: comments, isLoading } = useBlogComments({
    store: store?.id,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const approveComment = useApproveBlogComment();
  const rejectComment = useRejectBlogComment();
  const trashComment = useTrashBlogComment();
  const approveAll = useApproveAllBlogComments();

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      spam: "bg-red-100 text-red-700",
      trash: "bg-gray-100 text-gray-500",
    };
    const icons: Record<string, typeof MessageSquare> = {
      pending: AlertTriangle,
      approved: CheckCircle,
      spam: AlertTriangle,
      trash: Trash2,
    };
    const Icon = icons[status] || MessageSquare;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.pending}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "pending", "approved", "spam", "trash"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {statusFilter === "pending" && (
          <button
            onClick={() => store?.id && approveAll.mutate(store.id)}
            disabled={approveAll.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Approve All
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !comments || comments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No comments</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter === "all"
              ? "No comments yet."
              : `No ${statusFilter} comments.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {comment.author_name || "Anonymous"}
                        {comment.is_guest && (
                          <span className="ms-2 text-xs text-gray-400">(guest)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{comment.author_email}</p>
                    </div>
                    {statusBadge(comment.status)}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{comment.content}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  {openMenuId === comment.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {comment.status !== "approved" && (
                        <button
                          onClick={() => { approveComment.mutate(comment.id); setOpenMenuId(null); }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                      )}
                      {comment.status !== "spam" && (
                        <button
                          onClick={() => { rejectComment.mutate(comment.id); setOpenMenuId(null); }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                        >
                          <AlertTriangle className="h-4 w-4" /> Mark Spam
                        </button>
                      )}
                      {comment.status !== "trash" && (
                        <button
                          onClick={() => { trashComment.mutate(comment.id); setOpenMenuId(null); }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" /> Trash
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
