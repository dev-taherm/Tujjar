"use client";

import { Card, CardContent, Badge, EmptyState } from "@/shared/ui";
import { useCustomerReviews, useApproveReview, useRejectReview } from "@/api/queries";
import { formatDateTime } from "@/lib/utils";
import { Star, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface CustomerReviewsProps {
  customerId: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export function CustomerReviews({ customerId }: CustomerReviewsProps) {
  const t = useTranslations("dashboard.customer");
  const { data: reviews = [], isLoading } = useCustomerReviews(customerId);
  const approveReview = useApproveReview();
  const rejectReview = useRejectReview();

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("reviews")}</h2>
      {reviews.length === 0 ? (
        <EmptyState icon={Star} title={t("noReviews")} description={t("noReviewsDesc")} />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      <Badge variant={review.is_approved ? "success" : "warning"}>
                        {review.is_approved ? t("approved") : t("pending")}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-medium">{review.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{review.body}</p>
                    <p className="mt-2 text-xs text-gray-400">{formatDateTime(review.created_at)}</p>
                  </div>
                  <div className="flex gap-1">
                    {!review.is_approved && (
                      <button
                        onClick={() => approveReview.mutate(review.id)}
                        className="rounded-lg p-1 text-green-600 hover:bg-green-50"
                        title={t("approveReview")}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {review.is_approved && (
                      <button
                        onClick={() => rejectReview.mutate(review.id)}
                        className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                        title={t("rejectReview")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
