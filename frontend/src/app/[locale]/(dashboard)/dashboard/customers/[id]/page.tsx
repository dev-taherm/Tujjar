"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Badge,
  Dialog,
  EmptyState,
} from "@/shared/ui";
import {
  useUpdateCustomer,
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useWishlist,
  useRemoveFromWishlist,
  useCustomerReviews,
  useApproveReview,
  useRejectReview,
  useLoyaltyTransactions,
  useAdjustLoyalty,
  useSavedCarts,
  useDeleteSavedCart,
} from "@/api/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Save,
  MapPin,
  Heart,
  Star,
  Award,
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  X,
  User,
} from "lucide-react";
import { useState } from "react";
import type { Customer, Address, LoyaltyTransaction, SavedCart } from "@/shared/types";
import { useTranslations } from "next-intl";

type TabId = "overview" | "addresses" | "wishlist" | "reviews" | "loyalty" | "saved-carts";

export default function CustomerDetailPage() {
  const t = useTranslations("dashboard.customer");
  const tc = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const updateCustomer = useUpdateCustomer();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customers", customerId],
    queryFn: async (): Promise<Customer> => {
      const { data } = await apiClient.get(`/customers/${customerId}/`);
      return data;
    },
    enabled: !!customerId,
  });

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: "overview", label: t("overview"), icon: User },
    { id: "addresses", label: t("addresses"), icon: MapPin },
    { id: "wishlist", label: t("wishlist"), icon: Heart },
    { id: "reviews", label: t("reviews"), icon: Star },
    { id: "loyalty", label: t("loyalty"), icon: Award },
    { id: "saved-carts", label: t("savedCarts"), icon: ShoppingCart },
  ];

  if (isLoading)
    return <div className="h-[400px] animate-pulse rounded-xl bg-gray-200" />;
  if (!customer)
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">{t("notFound")}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <OverviewTab customer={customer} customerId={customerId} updateCustomer={updateCustomer} t={t} tc={tc} />
      )}
      {activeTab === "addresses" && <AddressesTab customerId={customerId} storeId={customer.store} t={t} tc={tc} />}
      {activeTab === "wishlist" && <WishlistTab customerId={customerId} t={t} />}
      {activeTab === "reviews" && <ReviewsTab customerId={customerId} t={t} />}
      {activeTab === "loyalty" && <LoyaltyTab customer={customer} customerId={customerId} t={t} tc={tc} />}
      {activeTab === "saved-carts" && <SavedCartsTab customerId={customerId} t={t} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab({
  customer,
  customerId,
  updateCustomer,
  t,
  tc,
}: {
  customer: Customer;
  customerId: string;
  updateCustomer: ReturnType<typeof useUpdateCustomer>;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  const [firstName, setFirstName] = useState(customer.first_name);
  const [lastName, setLastName] = useState(customer.last_name);
  const [phone, setPhone] = useState(customer.phone);
  const [company, setCompany] = useState(customer.company);
  const [notes, setNotes] = useState(customer.notes);

  const handleSave = async () => {
    await updateCustomer.mutateAsync({
      id: customerId,
      first_name: firstName,
      last_name: lastName,
      phone,
      company,
      notes,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t("firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label={t("lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input label={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label={t("company")} value={company} onChange={(e) => setCompany(e.target.value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("notesPlaceholder")}
            />
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={updateCustomer.isPending}>
            <Save className="me-2 h-4 w-4" /> {tc("save")}
          </Button>
        </div>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("stats")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("orders")}</span>
              <span className="font-medium">{customer.orders_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("totalSpent")}</span>
              <span className="font-medium">{formatCurrency(Number(customer.total_spent))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("loyaltyPoints")}</span>
              <span className="font-medium">{customer.loyalty_points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("joined")}</span>
              <span className="font-medium">{formatDateTime(customer.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Addresses Tab
// ---------------------------------------------------------------------------

function AddressesTab({
  customerId,
  storeId,
  t,
  tc,
}: {
  customerId: string;
  storeId: string;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  const { data: addresses = [], isLoading } = useAddresses(customerId);
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const handleCreate = async () => {
    await createAddress.mutateAsync({
      store: storeId,
      customer: customerId,
      label,
      address_line1: addressLine1,
      city,
      state,
      postal_code: postalCode,
      country,
    });
    setShowForm(false);
    setLabel("");
    setAddressLine1("");
    setCity("");
    setState("");
    setPostalCode("");
    setCountry("");
  };

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("addresses")}</h2>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="me-1 h-4 w-4" /> {t("addAddress")}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title={t("noAddresses")} description={t("noAddressesDesc")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr: Address) => (
            <Card key={addr.id} className="relative">
              {addr.is_default && (
                <Badge variant="success" className="absolute right-3 top-3">
                  {t("default")}
                </Badge>
              )}
              <CardContent className="pt-6">
                <p className="font-medium">{addr.label}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {addr.address_line1}
                  {addr.address_line2 && `, ${addr.address_line2}`}
                </p>
                <p className="text-sm text-gray-600">
                  {addr.city}, {addr.state} {addr.postal_code}
                </p>
                <p className="text-sm text-gray-600">{addr.country}</p>
                <div className="mt-3 flex gap-2">
                  {!addr.is_default && (
                    <Button size="sm" variant="secondary" onClick={() => setDefault.mutate(addr.id)}>
                      <Check className="me-1 h-3 w-3" /> {t("setDefault")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => deleteAddress.mutate(addr.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title={t("addAddress")}>
        <div className="space-y-4">
          <Input label={t("addressLabel")} value={label} onChange={(e) => setLabel(e.target.value)} />
          <Input label={t("addressLine1")} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t("city")} value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label={t("state")} value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t("postalCode")} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            <Input label={t("country")} value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>{tc("cancel")}</Button>
            <Button onClick={handleCreate} isLoading={createAddress.isPending}>{tc("save")}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wishlist Tab
// ---------------------------------------------------------------------------

function WishlistTab({
  customerId,
  t,
}: {
  customerId: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { data: items = [], isLoading } = useWishlist(customerId);
  const removeFromWishlist = useRemoveFromWishlist();

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("wishlist")}</h2>
      {items.length === 0 ? (
        <EmptyState icon={Heart} title={t("noWishlistItems")} description={t("noWishlistItemsDesc")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.product_title}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(Number(item.product_price))}</p>
                  </div>
                  <button
                    onClick={() => removeFromWishlist.mutate(item.id)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {item.note && <p className="mt-2 text-sm text-gray-500">{item.note}</p>}
                <p className="mt-2 text-xs text-gray-400">{formatDateTime(item.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reviews Tab
// ---------------------------------------------------------------------------

function ReviewsTab({
  customerId,
  t,
}: {
  customerId: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { data: reviews = [], isLoading } = useCustomerReviews(customerId);
  const approveReview = useApproveReview();
  const rejectReview = useRejectReview();

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("reviews")}</h2>
      {reviews.length === 0 ? (
        <EmptyState icon={Star} title={t("noReviews")} description={t("noReviewsDesc")} />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <Badge variant={review.is_approved ? "success" : "warning"}>
                        {review.is_approved ? t("approved") : t("pending")}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-medium">{review.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{review.body}</p>
                    <p className="mt-2 text-xs text-gray-400">{formatDateTime(review.created_at)}</p>
                  </div>
                  <div className="flex gap-1">
                    {!review.is_approved && (
                      <button
                        onClick={() => approveReview.mutate(review.id)}
                        className="rounded-lg p-1 text-green-600 hover:bg-green-50"
                        title={t("approveReview")}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {review.is_approved && (
                      <button
                        onClick={() => rejectReview.mutate(review.id)}
                        className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                        title={t("rejectReview")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loyalty Tab
// ---------------------------------------------------------------------------

function LoyaltyTab({
  customer,
  customerId,
  t,
  tc,
}: {
  customer: Customer;
  customerId: string;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  const { data: transactions = [], isLoading } = useLoyaltyTransactions(customerId);
  const adjustLoyalty = useAdjustLoyalty();
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustDesc, setAdjustDesc] = useState("");

  const handleAdjust = async () => {
    await adjustLoyalty.mutateAsync({
      customer_id: customerId,
      points: adjustPoints,
      description: adjustDesc,
    });
    setShowAdjust(false);
    setAdjustPoints(0);
    setAdjustDesc("");
  };

  const typeBadge = (type: string) => {
    const variants: Record<string, "success" | "warning" | "danger" | "info"> = {
      earned: "success",
      adjusted: "info",
      redeemed: "warning",
      expired: "danger",
    };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("loyalty")}</h2>
        <Button onClick={() => setShowAdjust(true)} size="sm">
          <Plus className="me-1 h-4 w-4" /> {t("adjustPoints")}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Award className="h-10 w-10 text-yellow-500" />
            <div>
              <p className="text-3xl font-bold">{customer.loyalty_points}</p>
              <p className="text-sm text-gray-500">{t("currentBalance")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {transactions.length === 0 ? (
        <p className="py-8 text-center text-gray-500">{t("noTransactions")}</p>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">{t("date")}</th>
                  <th className="pb-2 font-medium">{t("type")}</th>
                  <th className="pb-2 font-medium">{t("points")}</th>
                  <th className="pb-2 font-medium">{t("balance")}</th>
                  <th className="pb-2 font-medium">{t("description")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: LoyaltyTransaction) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-3">{formatDateTime(tx.created_at)}</td>
                    <td className="py-3">{typeBadge(tx.type)}</td>
                    <td className={`py-3 font-medium ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.points > 0 ? "+" : ""}{tx.points}
                    </td>
                    <td className="py-3">{tx.balance}</td>
                    <td className="py-3 text-gray-500">{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdjust} onClose={() => setShowAdjust(false)} title={t("adjustPoints")}>
        <div className="space-y-4">
          <Input
            label={t("points")}
            type="number"
            value={adjustPoints}
            onChange={(e) => setAdjustPoints(Number(e.target.value))}
          />
          <Textarea
            label={t("reason")}
            value={adjustDesc}
            onChange={(e) => setAdjustDesc(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdjust(false)}>{tc("cancel")}</Button>
            <Button onClick={handleAdjust} isLoading={adjustLoyalty.isPending}>{tc("save")}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saved Carts Tab
// ---------------------------------------------------------------------------

function SavedCartsTab({
  customerId,
  t,
}: {
  customerId: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { data: carts = [], isLoading } = useSavedCarts(customerId);
  const deleteSavedCart = useDeleteSavedCart();

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("savedCarts")}</h2>
      {carts.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={t("noSavedCarts")} description={t("noSavedCartsDesc")} />
      ) : (
        <div className="space-y-4">
          {carts.map((cart: SavedCart) => (
            <Card key={cart.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{cart.name}</h3>
                    <p className="text-sm text-gray-500">
                      {cart.item_count} {cart.item_count === 1 ? "item" : "items"}
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(cart.created_at)}</p>
                  </div>
                  <button
                    onClick={() => deleteSavedCart.mutate(cart.id)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {cart.items.length > 0 && (
                  <div className="mt-3 space-y-1 border-t pt-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product_title} × {item.quantity}
                        </span>
                        <span>{formatCurrency(Number(item.unit_price))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
