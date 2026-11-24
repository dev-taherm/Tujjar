"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui";
import { ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCustomerAuthStore } from "@/stores/customer-auth";
import { useGuestCartStore } from "@/stores/guest-cart";
import { customerClient } from "@/api/customer-client";
import type { StorefrontProduct, StorefrontVariant } from "@/lib/server/storefront-api";

/**
 * Interactive purchase panel for the storefront product page: variant
 * selection, quantity stepper, wishlist toggle and add-to-cart (customer
 * cart API when logged in, guest cart store otherwise).
 */
export function ProductPurchasePanel({ product, slug }: { product: StorefrontProduct; slug: string }) {
  const t = useTranslations("storefront.product");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const addItem = useGuestCartStore((s) => s.addItem);
  const queryClient = useQueryClient();

  // Initial wishlist state (customer only)
  useQuery({
    queryKey: ["customer-wishlist", slug],
    queryFn: async () => {
      const { data } = await customerClient.get("/customers/storefront/wishlist/");
      const entries = data as Array<{ product: string }>;
      setWishlisted(entries.some((e) => e.product === product.id));
      return entries;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const variants: StorefrontVariant[] = product.variants ?? [];
  const activeVariant = selectedVariant ? variants.find((v) => v.id === selectedVariant) : undefined;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      if (isAuthenticated) {
        await customerClient.post("/orders/carts/add/", {
          store: slug,
          product: product.id,
          variant: selectedVariant || undefined,
          quantity,
        });
        queryClient.invalidateQueries({ queryKey: ["cart", slug] });
      } else {
        addItem({
          productId: product.id,
          productTitle: product.title,
          variantId: selectedVariant || undefined,
          variantName: activeVariant?.name,
          unitPrice: activeVariant?.price ?? Number(product.price),
          imageUrl: product.primary_image?.url ?? undefined,
          quantity,
        });
      }
      toast.success(t("addedToCart"));
    } catch {
      toast.error(t("addToCartFailed"));
    } finally {
      setAdding(false);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error(t("signInToWishlist"));
      return;
    }
    try {
      if (wishlisted) {
        await customerClient.delete(`/customers/storefront/wishlist/${product.id}/`);
        setWishlisted(false);
        toast.success(t("removedFromWishlist"));
      } else {
        await customerClient.post("/customers/storefront/wishlist/", {
          product_id: product.id,
        });
        setWishlisted(true);
        toast.success(t("addedToWishlist"));
      }
      queryClient.invalidateQueries({ queryKey: ["customer-wishlist", slug] });
    } catch {
      toast.error(t("addToCartFailed"));
    }
  };

  return (
    <div className="space-y-6">
      {variants.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700">{t("options")}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  selectedVariant === v.id ? "border-[var(--color-primary)]" : "border-gray-200"
                }`}
                style={selectedVariant === v.id ? { borderColor: "var(--color-primary)", background: "var(--color-surface)" } : {}}
              >
                {v.name} {v.price != null && <span className="text-gray-500">${v.price}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-gray-200">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2" aria-label={t("decreaseQuantity")}>
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 text-sm font-medium">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2" aria-label={t("increaseQuantity")}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <Button className="flex-1" size="lg" onClick={handleAddToCart} isLoading={adding}>
          <ShoppingCart className="me-2 h-4 w-4" /> {t("addToCart")}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={toggleWishlist}
          aria-label={t("addToWishlist")}
          style={wishlisted ? { borderColor: "var(--color-primary)" } : undefined}
        >
          <Heart
            className="h-4 w-4"
            style={wishlisted ? { color: "var(--color-primary)", fill: "var(--color-primary)" } : undefined}
          />
        </Button>
      </div>
    </div>
  );
}
