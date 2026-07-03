"use client";

import { use } from "react";
import { Button } from "@/shared/ui";
import { ShoppingBag, Plus, Minus, Trash2, LogIn } from "lucide-react";
import Link from "next/link";
import { customerClient } from "@/api/customer-client";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCustomerAuthStore } from "@/stores/customer-auth";
import { useGuestCartStore } from "@/stores/guest-cart";

interface CartItem {
  id: string;
  product: string;
  product_title: string;
  quantity: number;
  unit_price: string;
  line_total: number;
}

interface Cart {
  id: string;
  subtotal: string;
  items: CartItem[];
  total_items: number;
}

export default function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const t = useTranslations("storefront.cart");
  const queryClient = useQueryClient();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const guestItems = useGuestCartStore((s) => s.items);
  const guestUpdateQuantity = useGuestCartStore((s) => s.updateQuantity);
  const guestRemoveItem = useGuestCartStore((s) => s.removeItem);
  const guestTotalPrice = useGuestCartStore((s) => s.getTotalPrice);
  const guestTotalItems = useGuestCartStore((s) => s.getTotalItems);

  const { data: cart, isLoading: loading } = useQuery<Cart | null>({
    queryKey: ["cart", slug],
    queryFn: async () => {
      try {
        const { data } = await customerClient.get("/customers/cart/", { params: { store: slug } });
        const results = data.results || data;
        return results.length > 0 ? results[0] : null;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
  });

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!cart) return;
    try {
      if (quantity <= 0) {
        await customerClient.post(`/customers/cart/${cart.id}/items/remove/`, { item_id: itemId });
      } else {
        await customerClient.post(`/customers/cart/${cart.id}/items/update/`, {
          item_id: itemId,
          quantity,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["cart", slug] });
      queryClient.invalidateQueries({ queryKey: ["customer-cart-count", slug] });
    } catch {
      toast.error(t("updateFailed"));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // Guest cart view
  if (!isAuthenticated) {
    if (guestItems.length === 0) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <div className="mt-8 rounded-xl border border-gray-200 p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">{t("empty")}</h2>
            <p className="mt-2 text-sm text-gray-500">{t("emptyDescription")}</p>
            <Link href={`/${locale}/shop/${slug}/shop`} className="mt-6 inline-block">
              <Button>{t("continueShopping")}</Button>
            </Link>
          </div>
        </div>
      );
    }

    const guestSubtotal = guestTotalPrice();
    const guestCount = guestTotalItems();

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("title")} ({guestCount} items)
        </h1>
        <div className="mt-2 mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <LogIn className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            {t("guestCartNotice")}{" "}
            <Link href={`/${locale}/shop/${slug}/login`} className="font-medium underline">
              {t("signInToCheckout")}
            </Link>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {guestItems.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productTitle}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{item.productTitle}</h3>
                    {item.variantName && (
                      <p className="text-xs text-gray-500">{item.variantName}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      ${item.unitPrice.toFixed(2)} each
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => guestUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                    className="rounded-lg border border-gray-300 p-1 hover:bg-gray-50"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => guestUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    className="rounded-lg border border-gray-300 p-1 hover:bg-gray-50"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => guestRemoveItem(item.productId, item.variantId)}
                    className="rounded-lg p-1 text-red-500 hover:bg-red-50 ms-2"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900">{t("orderSummary")}</h2>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("subtotal")}</span>
                  <span className="font-medium">${guestSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("shipping")}</span>
                  <span className="font-medium">{t("calculatedAtCheckout")}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-bold">{t("total")}</span>
                  <span className="font-bold">${guestSubtotal.toFixed(2)}</span>
                </div>
              </div>
              <Link href={`/${locale}/shop/${slug}/login`} className="mt-4 block">
                <Button className="w-full">
                  <LogIn className="me-2 h-4 w-4" /> {t("signInToCheckout")}
                </Button>
              </Link>
              <Link href={`/${locale}/shop/${slug}/shop`} className="mt-2 block">
                <Button className="w-full" variant="outline">
                  {t("continueShopping")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated cart view
  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <div className="mt-8 rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">{t("empty")}</h2>
          <p className="mt-2 text-sm text-gray-500">{t("emptyDescription")}</p>
          <Link href={`/${locale}/shop/${slug}/shop`} className="mt-6 inline-block">
            <Button>{t("continueShopping")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">
        {t("title")} ({cart.total_items} items)
      </h1>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.product_title}</h3>
                <p className="text-sm text-gray-500">
                  ${parseFloat(item.unit_price).toFixed(2)} each
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="rounded-lg border border-gray-300 p-1 hover:bg-gray-50"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="rounded-lg border border-gray-300 p-1 hover:bg-gray-50"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => updateQuantity(item.id, 0)}
                  className="rounded-lg p-1 text-red-500 hover:bg-red-50 ms-2"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900">{t("orderSummary")}</h2>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("subtotal")}</span>
                <span className="font-medium">${parseFloat(cart.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("shipping")}</span>
                <span className="font-medium">{t("calculatedAtCheckout")}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between">
                <span className="font-bold">{t("total")}</span>
                <span className="font-bold">${parseFloat(cart.subtotal).toFixed(2)}</span>
              </div>
            </div>
            <Link href={`/${locale}/shop/${slug}/shop`} className="mt-4 block">
              <Button className="w-full" variant="outline">
                {t("continueShopping")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
