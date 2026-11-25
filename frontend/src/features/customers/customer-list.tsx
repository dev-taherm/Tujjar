"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchInput, EmptyState, Table, THead, THeadCell, TBody, TR, TD, Avatar } from "@/shared/ui";
import { useCustomers, useDeleteCustomer } from "@/api/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Users, Trash2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export function CustomerList() {
  const t = useTranslations("dashboard.customer");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useCustomers({ search: search || undefined });
  const deleteCustomer = useDeleteCustomer();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 shimmer rounded-lg" />
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
        <Table>
          <THead>
            <tr>
              <THeadCell>{t("customer")}</THeadCell>
              <THeadCell>{t("email")}</THeadCell>
              <THeadCell className="text-end">{t("orders")}</THeadCell>
              <THeadCell className="text-end">{t("totalSpent")}</THeadCell>
              <THeadCell className="text-end">{t("joined")}</THeadCell>
              <THeadCell className="w-12" />
            </tr>
          </THead>
          <TBody>
            {customers.map((customer) => (
              <TR
                key={customer.id}
                className="cursor-pointer"
                onClick={() => router.push(`/${locale}/dashboard/customers/${customer.id}`)}
              >
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="sm"
                      name={customer.full_name || `${customer.first_name} ${customer.last_name}`}
                    />
                    <span className="text-sm font-medium">
                      {customer.first_name} {customer.last_name}
                    </span>
                  </div>
                </TD>
                <TD className="text-sm text-ink-soft">{customer.email}</TD>
                <TD className="text-end text-sm text-ink-soft tabular-nums">{customer.orders_count}</TD>
                <TD className="text-end text-sm font-medium tabular-nums">
                  {formatCurrency(Number(customer.total_spent))}
                </TD>
                <TD className="text-end text-sm text-ink-soft">{formatDateTime(customer.created_at)}</TD>
                <TD className="text-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t("deleteCustomerConfirm"))) deleteCustomer.mutateAsync(customer.id);
                    }}
                    className="rounded p-1 text-ink-soft transition-colors hover:bg-error-soft hover:text-error"
                    aria-label={`${tc("delete")} ${customer.first_name} ${customer.last_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
