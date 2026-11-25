"use client";

import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/features/products/product-form";
import { useProduct } from "@/api/queries";
import { useTranslations } from "next-intl";

export default function ProductDetailPage() {
  const t = useTranslations("dashboard.error");
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const isNew = productId === "new";

  const { data: product, isLoading } = useProduct(isNew ? "" : productId);

  if (isNew) {
    return <ProductForm onSuccess={() => router.back()} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 shimmer rounded-lg" />
        <div className="h-[400px] shimmer rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return <div className="flex h-96 items-center justify-center"><p className="text-ink-soft">{t("productNotFound")}</p></div>;
  }

  return <ProductForm initialData={product} onSuccess={() => router.back()} />;
}
