"use client";

import { useRouter } from "next/navigation";
import { Button, Badge, Input, Select, SearchInput, EmptyState } from "@/shared/ui";
import { useOrders } from "@/api/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useState } from "react";
import { Eye, Package } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  authorized: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  partially_paid: "bg-orange-100 text-orange-800",
  refunded: "bg-red-100 text-red-800",
  voided: "bg-gray-100 text-gray-800",
};

export function OrderList() {
  const t = useTranslations("dashboard.orders");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data: orders, isLoading } = useOrders({
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const statusOptions = [
    { value: "", label: t("allStatuses") },
    { value: "pending", label: t("pending") },
    { value: "confirmed", label: t("confirmed") },
    { value: "processing", label: t("processing") },
    { value: "shipped", label: t("shipped") },
    { value: "delivered", label: t("delivered") },
    { value: "cancelled", label: t("cancelled") },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
        <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
      </div>

      {!orders?.length ? (
        <EmptyState
          icon={Package}
          title={t("noOrders")}
          description={t("ordersWillAppear")}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t("order")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t("customer")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{tc("status")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t("payment")}</th>
                <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t("total")}</th>
                <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t("date")}</th>
                <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/${locale}/dashboard/orders/${order.id}`)}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.order_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.customer_name || order.customer_email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || ""}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${paymentColors[order.payment_status] || ""}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end text-sm font-medium text-gray-900">{formatCurrency(Number(order.total))}</td>
                  <td className="px-4 py-3 text-end text-sm text-gray-500">{formatDateTime(order.created_at)}</td>
                  <td className="px-4 py-3 text-end">
                    <button className="rounded p-1 text-gray-400 hover:bg-gray-100"><Eye className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
