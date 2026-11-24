"use client";

import { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Label } from "@/shared/ui";
import { ShoppingBag, Banknote, CreditCard, CheckCircle2, Tag, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCustomerAuthStore } from "@/stores/customer-auth";
import { useGuestCartStore } from "@/stores/guest-cart";
import { customerClient } from "@/api/customer-client";

interface QuoteRate {
  id: string;
  name: string;
  description: string;
  price: string;
  transit_time: string;
}

interface Quote {
  subtotal: string;
  discount: string;
  discount_code: string;
  discount_type: string;
  tax: string;
  tax_rate: string;
  tax_inclusive: boolean;
  shipping: string;
  shipping_rate_id: string | null;
  shipping_rate_name: string;
  total: string;
  shipping_rates: QuoteRate[];
}

interface ServerCartItem {
  product: string;
  variant: string | null;
  quantity: number;
}

interface PlacedOrder {
  order_number: string;
  total: string;
  currency: string;
}

const COUNTRY_CODES = [
  "US", "SA", "AE", "KW", "QA", "BH", "OM", "JO", "EG", "GB", "DE", "FR", "CA",
];

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const t = useTranslations("storefront.checkout");
  const queryClient = useQueryClient();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const guestItems = useGuestCartStore((s) => s.items);
  const clearGuestCart = useGuestCartStore((s) => s.clearCart);

  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "SA",
  });
  const [discountInput, setDiscountInput] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");

  // Which payment methods the store supports (card = Stripe configured)
  const { data: payConfig } = useQuery<{ cod: boolean; bank_transfer: boolean; card: boolean }>({
    queryKey: ["checkout-config", slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/payments/config/${slug}/`);
      if (!res.ok) return { cod: true, bank_transfer: true, card: false };
      return res.json();
    },
    staleTime: 300_000,
  });
  const cardEnabled = payConfig?.card ?? false;
  // Fall back to COD when card isn't offered by the store
  const effectivePaymentMethod: "cod" | "card" =
    paymentMethod === "card" && !cardEnabled ? "cod" : paymentMethod;

  // Resolve checkout items from guest cart or server cart
  const { data: serverCart, isLoading: cartLoading } = useQuery<{
    id: string;
    items: ServerCartItem[];
  } | null>({
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

  const items = useMemo<
    { product_id: string; variant_id?: string; quantity: number }[]
  >(() => {
    if (isAuthenticated && serverCart) {
      return serverCart.items.map((item) => ({
        product_id: item.product,
        variant_id: item.variant || undefined,
        quantity: item.quantity,
      }));
    }
    return guestItems.map((item) => ({
      product_id: item.productId,
      variant_id: item.variantId || undefined,
      quantity: item.quantity,
    }));
  }, [isAuthenticated, serverCart, guestItems]);

  const quoteBody = useMemo(
    () => ({
      ...(isAuthenticated && serverCart
        ? { cart_id: serverCart.id }
        : { items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })) }),
      discount_code: discountCode || undefined,
      shipping_country: form.country || undefined,
      shipping_state: form.state || undefined,
      shipping_postal_code: form.postal_code || undefined,
      shipping_rate_id: selectedRateId || undefined,
    }),
    [isAuthenticated, serverCart, items, discountCode, form.country, form.state, form.postal_code, selectedRateId]
  );

  const canQuote = items.length > 0;

  const { data: quote, isFetching: quoting } = useQuery<Quote | null>({
    queryKey: ["checkout-quote", slug, quoteBody],
    queryFn: async () => {
      const res = await fetch(`/api/v1/store/${slug}/checkout/quote/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteBody),
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: canQuote,
    staleTime: 30_000,
  });

  // Effective shipping rate selection: user choice wins if still available,
  // otherwise auto-select the cheapest available option (derived, no effect).
  // The quote request only carries the user's explicit choice so the
  // auto-selection doesn't trigger a refetch loop.
  const effectiveRateId = useMemo<string | null>(() => {
    if (!quote) return null;
    const rates = quote.shipping_rates || [];
    if (rates.length === 0) return null;
    if (selectedRateId && rates.some((r) => r.id === selectedRateId)) {
      return selectedRateId;
    }
    const cheapest = [...rates].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
    return cheapest.id;
  }, [quote, selectedRateId]);

  const applyDiscount = () => {
    if (!discountInput.trim()) return;
    setDiscountCode(discountInput.trim().toUpperCase());
  };

  const validate = useCallback((): string | null => {
    if (!form.email.trim()) return t("emailRequired");
    if (!form.line1.trim() || !form.city.trim()) return t("addressRequired");
    return null;
  }, [form, t]);

  const placeOrder = async () => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      const payload = {
        ...(isAuthenticated && serverCart
          ? { cart_id: serverCart.id }
          : {
              items: items.map((i) => ({
                product_id: i.product_id,
                variant_id: i.variant_id,
                quantity: i.quantity,
              })),
            }),
        customer_email: form.email.trim(),
        customer_first_name: form.first_name.trim(),
        customer_last_name: form.last_name.trim(),
        customer_phone: form.phone.trim(),
        discount_code: discountCode || undefined,
        shipping_rate_id: effectiveRateId || undefined,
        payment_method: effectivePaymentMethod,
        // Card payments need redirect URLs for the Stripe-hosted checkout
        ...(effectivePaymentMethod === "card"
          ? {
              success_url: `${window.location.origin}/${locale}/shop/${slug}/shop/checkout/success/?order={CHECKOUT_SESSION_ID}`,
              cancel_url: `${window.location.origin}/${locale}/shop/${slug}/shop/checkout/?cancelled=1`,
            }
          : {}),
        shipping_address: {
          line1: form.line1.trim(),
          line2: form.line2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postal_code.trim(),
          country: form.country.trim().toUpperCase(),
        },
      };
      const res = await fetch(`/api/v1/store/${slug}/checkout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("error"));
        return;
      }
      if (!isAuthenticated) clearGuestCart();
      queryClient.invalidateQueries({ queryKey: ["cart", slug] });
      queryClient.invalidateQueries({ queryKey: ["customer-cart-count", slug] });
      // Card: redirect to Stripe-hosted checkout page
      if (data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      setPlaced(data);
    } catch {
      toast.error(t("error"));
    }
  };

  // Success state
  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <CheckCircle2 className="mx-auto h-16 w-16" style={{ color: "var(--color-success, #16a34a)" }} />
        <h1 className="mt-6 text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          {t("thankYou")}
        </h1>
        <p className="mt-2 text-lg" style={{ color: "var(--color-text-secondary)" }}>
          {t("orderNumber")}: <span className="font-mono font-semibold">{placed.order_number}</span>
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {placed.currency} {placed.total}
        </p>
        <Link href={`/${locale}/shop/${slug}`} className="mt-8 inline-block">
          <Button size="lg">{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  // Empty cart
  if (!cartLoading && items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-12 w-12" style={{ color: "var(--color-text-secondary)" }} />
        <h1 className="mt-4 text-xl font-semibold" style={{ color: "var(--color-text)" }}>
          {t("emptyCart")}
        </h1>
        <Link href={`/${locale}/shop/${slug}/shop`} className="mt-6 inline-block">
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  const money = (v: string | number) =>
    `${quote ? "$" : "$"}${parseFloat(String(v)).toFixed(2)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{t("title")}</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Form column */}
        <div className="space-y-8 lg:col-span-3">
          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {t("contact")}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="co-email">{t("email")}</Label>
                <Input
                  id="co-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="co-first">{t("firstName")}</Label>
                <Input id="co-first" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="co-last">{t("lastName")}</Label>
                <Input id="co-last" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="co-phone">{t("phone")}</Label>
                <Input id="co-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {t("shippingAddress")}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="co-line1">{t("addressLine1")}</Label>
                <Input id="co-line1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="co-line2">{t("addressLine2")}</Label>
                <Input id="co-line2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="co-city">{t("city")}</Label>
                <Input id="co-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="co-state">{t("state")}</Label>
                <Input id="co-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="co-postal">{t("postalCode")}</Label>
                <Input id="co-postal" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="co-country">{t("country")}</Label>
                <select
                  id="co-country"
                  value={form.country}
                  onChange={(e) => {
                    setForm({ ...form, country: e.target.value });
                    setSelectedRateId(null);
                  }}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  {COUNTRY_CODES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {t("discountCode")}
            </h2>
            <div className="mt-4 flex gap-2">
              <Input
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="SUMMER20"
                className="flex-1"
              />
              <Button variant="outline" onClick={applyDiscount}>
                <Tag className="me-2 h-4 w-4" /> {t("applyCode")}
              </Button>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {t("shippingMethod")}
            </h2>
            {quoting && !quote ? (
              <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <Loader2 className="h-4 w-4 animate-spin" /> …
              </div>
            ) : quote && quote.shipping_rates.length > 0 ? (
              <div className="mt-3 space-y-2">
                {quote.shipping_rates.map((rate) => (
                  <label
                    key={rate.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3"
                    style={{
                      borderColor: effectiveRateId === rate.id ? "var(--color-primary)" : "var(--color-border)",
                      background: effectiveRateId === rate.id ? "var(--color-surface)" : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping-rate"
                        checked={effectiveRateId === rate.id}
                        onChange={() => setSelectedRateId(rate.id)}
                      />
                      <div>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {rate.name}
                        </span>
                        {rate.transit_time && (
                          <span className="ms-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            {rate.transit_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {parseFloat(rate.price) === 0 ? "Free" : money(rate.price)}
                    </span>
                  </label>
                ))}
              </div>
            ) : quote ? (
              <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {t("noShipping")}
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {t("paymentMethod")}
            </h2>
            <div className="mt-3 space-y-2">
              <label
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                style={{
                  borderColor: effectivePaymentMethod === "cod" ? "var(--color-primary)" : "var(--color-border)",
                  background: effectivePaymentMethod === "cod" ? "var(--color-surface)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="payment-method"
                  checked={effectivePaymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <Banknote className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  {t("cod")}
                </span>
              </label>
              {cardEnabled && (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                  style={{
                    borderColor: effectivePaymentMethod === "card" ? "var(--color-primary)" : "var(--color-border)",
                    background: effectivePaymentMethod === "card" ? "var(--color-surface)" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    checked={effectivePaymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <CreditCard className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    {t("card")}
                  </span>
                </label>
              )}
            </div>
          </section>
        </div>

        {/* Summary column */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border p-6 sticky top-24" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
              {t("orderSummary")}
            </h2>
            {quote ? (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-secondary)" }}>{t("subtotal")}</span>
                  <span style={{ color: "var(--color-text)" }}>{money(quote.subtotal)}</span>
                </div>
                {parseFloat(quote.discount) > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {t("discount")} {quote.discount_code && `(${quote.discount_code})`}
                    </span>
                    <span style={{ color: "var(--color-success, #16a34a)" }}>−{money(quote.discount)}</span>
                  </div>
                )}
                {parseFloat(quote.tax) > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {t("tax")} {quote.tax_inclusive ? "" : `(${quote.tax_rate}%)`}
                    </span>
                    <span style={{ color: "var(--color-text)" }}>
                      {quote.tax_inclusive ? `${money(quote.tax)} incl.` : money(quote.tax)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-secondary)" }}>{t("shipping")}</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {effectiveRateId ? money(quote.shipping) : "—"}
                  </span>
                </div>
                <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                  <span>{t("total")}</span>
                  <span>{money(effectiveRateId ? quote.total : parseFloat(quote.total) - parseFloat(quote.shipping))}</span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                …
              </p>
            )}
            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={placeOrder}
              disabled={!quote || quoting}
            >
              {quoting ? t("placingOrder") : t("placeOrder")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
