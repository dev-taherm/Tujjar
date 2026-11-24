"use client";

import { ReviewsModeration } from "@/features/commerce/reviews-moderation";
import { useTranslations } from "next-intl";

export default function ReviewsPage() {
  const t = useTranslations("dashboard.reviewsModeration");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>
      <ReviewsModeration />
    </div>
  );
}
