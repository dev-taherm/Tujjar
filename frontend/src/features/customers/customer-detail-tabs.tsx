"use client";

import { useState } from "react";
import { User, MapPin, Heart, Star, Award, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { CustomerOverview } from "./customer-overview";
import { CustomerAddresses } from "./customer-addresses";
import { CustomerWishlist } from "./customer-wishlist";
import { CustomerReviews } from "./customer-reviews";
import { CustomerLoyalty } from "./customer-loyalty";
import { CustomerSavedCarts } from "./customer-saved-carts";
import type { Customer } from "@/shared/types";

type TabId = "overview" | "addresses" | "wishlist" | "reviews" | "loyalty" | "saved-carts";

interface CustomerDetailTabsProps {
  customer: Customer;
  customerId: string;
}

const TAB_ICONS: Record<TabId, typeof User> = {
  overview: User,
  addresses: MapPin,
  wishlist: Heart,
  reviews: Star,
  loyalty: Award,
  "saved-carts": ShoppingCart,
};

export function CustomerDetailTabs({ customer, customerId }: CustomerDetailTabsProps) {
  const t = useTranslations("dashboard.customer");
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: t("overview") },
    { id: "addresses", label: t("addresses") },
    { id: "wishlist", label: t("wishlist") },
    { id: "reviews", label: t("reviews") },
    { id: "loyalty", label: t("loyalty") },
    { id: "saved-carts", label: t("savedCarts") },
  ];

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <CustomerOverview customer={customer} customerId={customerId} />
        )}
        {activeTab === "addresses" && (
          <CustomerAddresses customerId={customerId} storeId={customer.store} />
        )}
        {activeTab === "wishlist" && <CustomerWishlist customerId={customerId} />}
        {activeTab === "reviews" && <CustomerReviews customerId={customerId} />}
        {activeTab === "loyalty" && (
          <CustomerLoyalty customer={customer} customerId={customerId} />
        )}
        {activeTab === "saved-carts" && <CustomerSavedCarts customerId={customerId} />}
      </div>
    </>
  );
}
