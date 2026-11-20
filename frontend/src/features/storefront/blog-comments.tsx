"use client";

import { useState } from "react";
import { customerClient } from "@/api/customer-client";

/**
 * Comment form for storefront blog posts. Loaded as a client island beneath
 * the server-rendered article content.
 */
export function BlogComments({ postId }: { postId: string }) {
  const [commentContent, setCommentContent] = useState("");
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState(false);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setCommentSubmitting(true);
    setCommentError(false);
    try {
      await customerClient.post(`/blog/posts/${postId}/public-comment/`, {
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
      setCommentError(true);
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t pt-8" style={{ borderColor: "var(--color-border)" }}>
      <h2 className="mb-6 text-xl font-semibold" style={{ color: "var(--color-text)" }}>Leave a comment</h2>

      {commentSuccess && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
          Your comment has been submitted and is awaiting moderation.
        </div>
      )}
      {commentError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Failed to submit comment. Please try again.
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
            className="rounded-lg border px-4 py-2.5 text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />
          <input
            type="email"
            placeholder="Your email"
            value={commentEmail}
            onChange={(e) => setCommentEmail(e.target.value)}
            required
            className="rounded-lg border px-4 py-2.5 text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />
        </div>
        <textarea
          placeholder="Write your comment..."
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          required
          rows={4}
          className="w-full rounded-lg border px-4 py-2.5 text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
        <button
          type="submit"
          disabled={commentSubmitting || !commentContent.trim()}
          className="rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--color-primary)" }}
        >
          {commentSubmitting ? "Submitting..." : "Submit Comment"}
        </button>
      </form>
    </div>
  );
}
