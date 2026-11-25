"use client";

import { ReviewsModeration } from "@/features/commerce/reviews-moderation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/ui";

export default function ReviewsPage() {
  const t = useTranslations("dashboard.reviewsModeration");
  return (
    <div className="space-y-6">
              <PageHeader title={t("title")} />
      <ReviewsModeration />
    </div>
  );
}
