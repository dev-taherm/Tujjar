"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui";
import { ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface StorefrontVariant {
  id: string;
  name: string;
  price: number | null;
}

export default function StorefrontProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = use(params);
  const locale = useLocale();
  const t = useTranslations("storefront.product");
  const tCommon = useTranslations("common");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["storefront", slug, "product", productSlug, locale],
    queryFn: async () => {
      const res = await fetch(`/api/v1/store/${slug}/products/${productSlug}/?locale=${locale}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (product) {
      document.title = product.seo_title || product.title || "";
      const setMeta = (name: string, content: string) => {
        let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
        if (!el) {
          el = document.createElement("meta");
          if (name.startsWith("og:")) {
            el.setAttribute("property", name);
          } else {
            el.setAttribute("name", name);
          }
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };
      if (product.seo_description || product.description) {
        setMeta("description", product.seo_description || product.description);
      }
      if (product.primary_image?.url) {
        setMeta("og:image", product.primary_image.url);
      }
      setMeta("og:title", product.seo_title || product.title || "");
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-gray-200" />
          <div className="space-y-4">
            <div className="h-8 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
            <div className="h-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="py-16 text-center text-gray-500">{t("notFound")}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
          {product.primary_image ? (
            <img
              src={product.primary_image.url}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              {tCommon("noImage")}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">${product.price}</span>
              {product.compare_at_price &&
                product.compare_at_price > product.price && (
                  <span className="text-lg text-gray-400 line-through">
                    ${product.compare_at_price}
                  </span>
                )}
            </div>
          </div>
          <p className="text-gray-600">{product.description}</p>
          {product.variants?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700">{t("options")}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v: StorefrontVariant) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      selectedVariant === v.id
                        ? "border-[var(--color-primary)]"
                        : "border-gray-200"
                    }`}
                    style={selectedVariant === v.id ? { borderColor: "var(--color-primary)", background: "var(--color-surface)" } : {}}
                  >
                    {v.name}{" "}
                    {v.price && <span className="text-gray-500">${v.price}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button className="flex-1" size="lg">
              <ShoppingCart className="me-2 h-4 w-4" /> {t("addToCart")}
            </Button>
            <Button variant="outline" size="lg">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
