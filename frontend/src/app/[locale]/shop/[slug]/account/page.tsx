"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent } from "@/shared/ui";
import { Package, Heart, MapPin, Trash2, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { customerClient } from "@/api/customer-client";
import { useCustomerAuthStore } from "@/stores/customer-auth";

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: string;
  currency: string;
  items_count: number;
  created_at: string;
}

interface WishlistEntry {
  id: string;
  product: string;
  product_title: string;
  product_price: string;
  product_thumbnail_url: string;
}

interface CustomerAddress {
  id: string;
  label: string;
  first_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

type Tab = "orders" | "wishlist" | "addresses";

export default function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const t = useTranslations("storefront.account");
  const queryClient = useQueryClient();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const customer = useCustomerAuthStore((s) => s.customer);
  const [tab, setTab] = useState<Tab>("orders");

  const ordersQuery = useQuery({
    queryKey: ["customer-orders", slug],
    queryFn: async () => {
      const { data } = await customerClient.get("/customers/storefront/orders/");
      return data as CustomerOrder[];
    },
    enabled: isAuthenticated,
  });

  const wishlistQuery = useQuery({
    queryKey: ["customer-wishlist", slug],
    queryFn: async () => {
      const { data } = await customerClient.get("/customers/storefront/wishlist/");
      return data as WishlistEntry[];
    },
    enabled: isAuthenticated && tab === "wishlist",
  });

  const addressesQuery = useQuery({
    queryKey: ["customer-addresses", slug],
    queryFn: async () => {
      const { data } = await customerClient.get("/customers/storefront/addresses/");
      return data as CustomerAddress[];
    },
    enabled: isAuthenticated && tab === "addresses",
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Package className="mx-auto h-12 w-12" style={{ color: "var(--color-text-secondary)" }} />
        <h1 className="mt-4 text-xl font-semibold" style={{ color: "var(--color-text)" }}>
          {t("signInRequired")}
        </h1>
        <Link href={`/${locale}/shop/${slug}/login`} className="mt-6 inline-block">
          <Button>{t("signIn")}</Button>
        </Link>
      </div>
    );
  }

  const removeFromWishlist = async (productId: string) => {
    try {
      await customerClient.delete(`/customers/storefront/wishlist/${productId}/`);
      queryClient.invalidateQueries({ queryKey: ["customer-wishlist", slug] });
      toast.success(t("removedFromWishlist"));
    } catch {
      toast.error(t("actionFailed"));
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      await customerClient.delete(`/customers/storefront/addresses/${addressId}/`);
      queryClient.invalidateQueries({ queryKey: ["customer-addresses", slug] });
      toast.success(t("addressRemoved"));
    } catch {
      toast.error(t("actionFailed"));
    }
  };

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: "orders", label: t("orders"), icon: Package },
    { key: "wishlist", label: t("wishlist"), icon: Heart },
    { key: "addresses", label: t("addresses"), icon: MapPin },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
        {t("title")}
      </h1>
      {customer && (
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {customer.email}
        </p>
      )}

      <div className="mt-6 flex gap-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: tab === key ? "var(--color-primary)" : "transparent",
              color: tab === key ? "var(--color-primary)" : "var(--color-text-secondary)",
            }}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {tab === "orders" && (
          <OrdersTab orders={ordersQuery.data} loading={ordersQuery.isLoading} slug={slug} locale={locale} />
        )}

        {tab === "wishlist" && (
          <WishlistTab
            items={wishlistQuery.data}
            loading={wishlistQuery.isLoading}
            slug={slug}
            locale={locale}
            onRemove={removeFromWishlist}
          />
        )}

        {tab === "addresses" && (
          <AddressesTab
            addresses={addressesQuery.data}
            loading={addressesQuery.isLoading}
            onDelete={deleteAddress}
          />
        )}
      </div>
    </div>
  );
}

function OrdersTab({
  orders,
  loading,
  slug,
  locale,
}: {
  orders?: CustomerOrder[];
  loading: boolean;
  slug: string;
  locale: string;
}) {
  const t = useTranslations("storefront.account");
  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl" style={{ background: "var(--color-surface)" }} />;
  }
  if (!orders?.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p style={{ color: "var(--color-text-secondary)" }}>{t("noOrders")}</p>
          <Link href={`/${locale}/shop/${slug}/shop`} className="mt-4 inline-block">
            <Button variant="outline">{t("startShopping")}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <span className="font-mono text-sm font-medium" style={{ color: "var(--color-text)" }}>
                {order.order_number}
              </span>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {new Date(order.created_at).toLocaleDateString()} · {order.items_count} items
              </p>
            </div>
            <div className="text-end">
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {order.currency} {order.total}
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
              >
                {order.status}
              </span>
            </div>
            <ChevronRight className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function WishlistTab({
  items,
  loading,
  slug,
  locale,
  onRemove,
}: {
  items?: WishlistEntry[];
  loading: boolean;
  slug: string;
  locale: string;
  onRemove: (productId: string) => void;
}) {
  const t = useTranslations("storefront.account");
  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl" style={{ background: "var(--color-surface)" }} />;
  }
  if (!items?.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Heart className="mx-auto h-10 w-10" style={{ color: "var(--color-text-secondary)" }} />
          <p className="mt-3" style={{ color: "var(--color-text-secondary)" }}>
            {t("noWishlistItems")}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-center gap-3 p-3">
            {item.product_thumbnail_url ? (
              <img
                src={item.product_thumbnail_url}
                alt={item.product_title}
                width={64}
                height={64}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg" style={{ background: "var(--color-surface)" }} />
            )}
            <div className="flex-1">
              <Link
                href={`/${locale}/shop/${slug}/shop/${item.product}`}
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--color-text)" }}
              >
                {item.product_title}
              </Link>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                ${parseFloat(item.product_price).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => onRemove(item.product)}
              className="rounded p-1 text-red-400 hover:bg-red-50"
              aria-label={t("removeFromWishlist")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AddressesTab({
  addresses,
  loading,
  onDelete,
}: {
  addresses?: CustomerAddress[];
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("storefront.account");
  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl" style={{ background: "var(--color-surface)" }} />;
  }
  if (!addresses?.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <MapPin className="mx-auto h-10 w-10" style={{ color: "var(--color-text-secondary)" }} />
          <p className="mt-3" style={{ color: "var(--color-text-secondary)" }}>
            {t("noAddresses")}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {addresses.map((address) => (
        <Card key={address.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {address.label}
                  {address.is_default && (
                    <span
                      className="ms-2 rounded-full px-2 py-0.5 text-xs"
                      style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
                    >
                      default
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {address.address_line1}
                  {address.address_line2 ? `, ${address.address_line2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postal_code}, {address.country}
                </p>
              </div>
              <button
                onClick={() => onDelete(address.id)}
                className="rounded p-1 text-red-400 hover:bg-red-50"
                aria-label={t("removeAddress")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
