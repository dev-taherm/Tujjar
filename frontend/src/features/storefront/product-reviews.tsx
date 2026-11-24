"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button, Input } from "@/shared/ui";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customerClient } from "@/api/customer-client";
import { useCustomerAuthStore } from "@/stores/customer-auth";

interface ReviewEntry {
  id: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  created_at: string;
}

interface ReviewsPayload {
  count: number;
  average: number;
  distribution: Record<string, number>;
  reviews: ReviewEntry[];
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{
            width: size,
            height: size,
            color: i <= value ? "#f59e0b" : "var(--color-border)",
            fill: i <= value ? "#f59e0b" : "transparent",
          }}
        />
      ))}
    </span>
  );
}

/**
 * Product reviews: public list + rating summary, with a review form for
 * signed-in customers (guests are prompted to sign in).
 */
export function ProductReviews({
  productSlug,
  storeSlug,
  productId,
}: {
  productSlug: string;
  storeSlug: string;
  productId: string;
}) {
  const t = useTranslations("storefront.reviews");
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["product-reviews", storeSlug, productSlug],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/store/${storeSlug}/products/${productSlug}/reviews/`
      );
      if (!res.ok) return null;
      return (await res.json()) as ReviewsPayload;
    },
    staleTime: 60_000,
  });

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error(t("fillAllFields"));
      return;
    }
    setSubmitting(true);
    try {
      await customerClient.post("/customers/storefront/reviews/", {
        product_id: productId,
        rating,
        title: title.trim(),
        body: body.trim(),
      });
      toast.success(t("reviewSubmitted"));
      setShowForm(false);
      setTitle("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["product-reviews", storeSlug, productSlug] });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        t("actionFailed");
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="mt-12 h-24 animate-pulse rounded-xl" style={{ background: "var(--color-surface)" }} />;
  }

  return (
    <div className="mt-12 border-t pt-8" style={{ borderColor: "var(--color-border)" }}>
      <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        {t("title")}
      </h2>

      {data && data.count > 0 && (
        <div className="mt-4 flex items-center gap-4">
          <span className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            {data.average}
          </span>
          <div>
            <Stars value={Math.round(data.average)} />
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {t("basedOn", { count: data.count })}
            </p>
          </div>
        </div>
      )}

      {isAuthenticated ? (
        showForm ? (
          <div className="mt-4 space-y-3 rounded-lg border p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {t("yourRating")}
              </span>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setRating(i)} aria-label={`${i} stars`}>
                  <Star
                    style={{
                      width: 20,
                      height: 20,
                      color: i <= rating ? "#f59e0b" : "var(--color-border)",
                      fill: i <= rating ? "#f59e0b" : "transparent",
                    }}
                  />
                </button>
              ))}
            </div>
            <Input
              placeholder={t("reviewTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder={t("reviewBody")}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submit} isLoading={submitting}>
                {t("submitReview")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowForm(true)}>
            {t("writeReview")}
          </Button>
        )
      ) : null}

      <div className="mt-6 space-y-4">
        {data?.reviews.map((review) => (
          <div key={review.id} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between">
              <Stars value={review.rating} />
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              {review.title}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {review.body}
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              — {review.author}
            </p>
          </div>
        ))}
        {data && data.count === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {t("noReviews")}
          </p>
        )}
      </div>
    </div>
  );
}
