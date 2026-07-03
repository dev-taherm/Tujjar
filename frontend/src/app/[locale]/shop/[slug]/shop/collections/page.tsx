"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { customerClient } from "@/api/customer-client";
import { useTranslations } from "next-intl";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  products_count: number;
}

export default function CollectionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const t = useTranslations("storefront.collections");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await customerClient.get(`/store/${slug}/collections/`, { params: { locale } });
        setCollections(data.results || data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, locale]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      {loading ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          {t("noCollections")}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/${locale}/shop/${slug}/shop/collections/${collection.slug}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
            >
              {collection.image_url ? (
                <img
                  src={collection.image_url}
                  alt={collection.name}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-gray-400">
                  No image
                </div>
              )}
              <div className="p-5">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {collection.name}
                </h2>
                {collection.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">{collection.description}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {collection.products_count} {collection.products_count === 1 ? "product" : "products"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
