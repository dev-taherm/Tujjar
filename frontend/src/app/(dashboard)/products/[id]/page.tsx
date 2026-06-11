"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/features/products/product-form";
import { useProduct } from "@/api/queries";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const isNew = productId === "new";

  const { data: product, isLoading } = useProduct(isNew ? "" : productId);

  if (isNew) {
    return <ProductForm mode="create" />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-[400px] animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!product) {
    return <div className="flex h-96 items-center justify-center"><p className="text-gray-500">Product not found.</p></div>;
  }

  return <ProductForm product={product} mode="edit" />;
}
