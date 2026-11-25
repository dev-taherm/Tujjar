"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Card, Badge, EmptyState } from "@/shared/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Star, Check, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ReviewRow {
  id: string;
  product: string;
  product_title?: string;
  customer_name?: string;
  rating: number;
  title: string;
  body: string;
  is_approved: boolean;
  created_at: string;
}

/**
 * Review moderation: approve/unapprove customer reviews. The API exposes
 * POST /customers/reviews/{id}/approve and /reject actions.
 */
export function ReviewsModeration() {
  const t = useTranslations("dashboard.reviewsModeration");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", filter],
    queryFn: async (): Promise<ReviewRow[]> => {
      const qs = filter ? `?is_approved=${filter}` : "";
      const { data } = await apiClient.get(`/customers/reviews/${qs}`);
      return data.results || data;
    },
  });

  const setApproved = async (id: string, approved: boolean) => {
    try {
      await apiClient.post(`/customers/reviews/${id}/${approved ? "approve" : "reject"}/`);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success(tc("saved"));
    } catch {
      toast.error(tc("error"));
    }
  };

  const filterOptions = [
    { value: "", label: t("all") },
    { value: "true", label: t("approved") },
    { value: "false", label: t("unapproved") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {filterOptions.map((o) => (
          <button
            key={o.value}
            onClick={() => setFilter(o.value)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={
              filter === o.value
                ? { background: "var(--color-primary)", color: "#fff" }
                : { background: "var(--color-surface)", color: "var(--color-text)" }
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 shimmer rounded-lg" />
          ))}
        </div>
      ) : !reviews?.length ? (
        <EmptyState icon={Star} title={t("noReviews")} description={t("noReviewsHint")} />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <div className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5"
                          style={{
                            color: i <= review.rating ? "#f59e0b" : "var(--color-border)",
                            fill: i <= review.rating ? "#f59e0b" : "transparent",
                          }}
                        />
                      ))}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {review.title}
                    </span>
                    <Badge variant={review.is_approved ? "success" : "warning"}>
                      {review.is_approved ? t("approved") : t("unapproved")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {review.body}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {review.customer_name || "Guest"} · {formatDateTime(review.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {review.is_approved ? (
                    <Button variant="outline" size="sm" onClick={() => setApproved(review.id, false)}>
                      <X className="me-1 h-3.5 w-3.5" /> {t("reject")}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setApproved(review.id, true)}>
                      <Check className="me-1 h-3.5 w-3.5" /> {t("approve")}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
