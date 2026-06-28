"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, SearchInput, EmptyState } from "@/shared/ui";
import { useCustomers, useDeleteCustomer } from "@/api/queries";
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils";
import { Users, Trash2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export function CustomerList() {
  const t = useTranslations("dashboard.customer");
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useCustomers({ search: search || undefined });
  const deleteCustomer = useDeleteCustomer();

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
      <div className="mb-6 flex items-center justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
      </div>

      {!customers?.length ? (
        <EmptyState
          icon={Users}
          title={t("noCustomers")}
          description={t("customerDataWillAppear")}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t("customer")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t("email")}</th>
                <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t("orders")}</th>
                <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t("totalSpent")}</th>
                <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t("joined")}</th>
                <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/${locale}/dashboard/customers/${customer.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                        {getInitials(customer.full_name || `${customer.first_name} ${customer.last_name}`)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {customer.first_name} {customer.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>
                  <td className="px-4 py-3 text-end text-sm text-gray-600">{customer.orders_count}</td>
                  <td className="px-4 py-3 text-end text-sm font-medium text-gray-900">
                    {formatCurrency(Number(customer.total_spent))}
                  </td>
                  <td className="px-4 py-3 text-end text-sm text-gray-500">
                    {formatDateTime(customer.created_at)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t("deleteCustomerConfirm"))) deleteCustomer.mutateAsync(customer.id);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
