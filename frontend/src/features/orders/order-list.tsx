"use client";

import { useRouter } from "next/navigation";
import { Button, Select, SearchInput, EmptyState, Table, THead, THeadCell, TBody, TR, TD } from "@/shared/ui";
import { useOrders } from "@/api/queries";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Eye, Package, Download } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-warning-soft text-warning",
  confirmed: "bg-primary-100 text-primary-800",
  processing: "bg-info-soft text-info",
  shipped: "bg-info/20 text-info",
  delivered: "bg-success-soft text-success",
  cancelled: "bg-error-soft text-error",
  refunded: "bg-rail text-ink",
};

const paymentColors: Record<string, string> = {
  pending: "bg-warning-soft text-warning",
  authorized: "bg-primary-100 text-primary-800",
  paid: "bg-success-soft text-success",
  partially_paid: "bg-warning-soft text-warning",
  refunded: "bg-error-soft text-error",
  voided: "bg-rail text-ink",
};

const pill = "inline-flex rounded-full px-2 py-0.5 text-xs font-medium";

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
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkApplying, setBulkApplying] = useState(false);
  const queryClient = useQueryClient();

  const runBulkAction = async (action: string) => {
    if (!selected.size) return;
    setBulkApplying(true);
    try {
      const { data } = await apiClient.post("/orders/orders/bulk-action/", {
        ids: Array.from(selected),
        action,
      });
      toast.success(t("bulkApplied", { applied: data.applied, skipped: data.skipped }));
      if (data.skipped > 0) {
        const firstError = (data.results || []).find((r: { error?: string }) => r.error);
        if (firstError?.error) toast.warning(firstError.error);
      }
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch {
      toast.error(tc("error"));
    } finally {
      setBulkApplying(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/orders/orders/export/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(tc("error"));
    } finally {
      setExporting(false);
    }
  };

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
          <div key={i} className="h-16 shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
        <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        <Button variant="outline" onClick={handleExport} isLoading={exporting}>
          <Download className="me-2 h-4 w-4" /> {t("exportCsv")}
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary-500/40 bg-primary-50 p-3 animate-pop">
          <span className="text-sm font-medium text-primary-700">
            {selected.size} {t("selected")}
          </span>
          {(["confirm", "ship", "deliver", "cancel"] as const).map((action) => (
            <Button
              key={action}
              size="sm"
              variant="outline"
              onClick={() => runBulkAction(action)}
              isLoading={bulkApplying}
            >
              {t(`bulk_${action}`)}
            </Button>
          ))}
          <button
            onClick={() => setSelected(new Set())}
            className="ms-auto text-sm text-ink-soft transition-colors hover:text-ink"
          >
            {tc("cancel")}
          </button>
        </div>
      )}

      {!orders?.length ? (
        <EmptyState
          icon={Package}
          title={t("noOrders")}
          description={t("ordersWillAppear")}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <THeadCell className="w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary-600"
                  checked={selected.size > 0 && selected.size === orders.length}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? new Set(orders.map((o) => o.id)) : new Set()
                    )
                  }
                  aria-label={t("selectAll")}
                />
              </THeadCell>
              <THeadCell>{t("order")}</THeadCell>
              <THeadCell>{t("customer")}</THeadCell>
              <THeadCell>{t("statusLabel")}</THeadCell>
              <THeadCell>{t("payment")}</THeadCell>
              <THeadCell className="text-end">{t("total")}</THeadCell>
              <THeadCell className="text-end">{t("date")}</THeadCell>
              <THeadCell className="w-12" />
            </tr>
          </THead>
          <TBody>
            {orders.map((order) => {
              const isSelected = selected.has(order.id);
              return (
                <TR
                  key={order.id}
                  className={cn(
                    "cursor-pointer",
                    isSelected && "bg-primary-50/70 hover:bg-primary-50/70"
                  )}
                  onClick={() => router.push(`/${locale}/dashboard/orders/${order.id}`)}
                >
                  <TD onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary-600"
                      checked={isSelected}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(order.id);
                        else next.delete(order.id);
                        setSelected(next);
                      }}
                      aria-label={`${t("select")} ${order.order_number}`}
                    />
                  </TD>
                  <TD className="text-sm font-medium">{order.order_number}</TD>
                  <TD className="text-sm text-ink-soft">
                    {order.customer_name || order.customer_email}
                  </TD>
                  <TD>
                    <span className={cn(pill, statusColors[order.status] || "")}>
                      {order.status}
                    </span>
                  </TD>
                  <TD>
                    <span className={cn(pill, paymentColors[order.payment_status] || "")}>
                      {order.payment_status}
                    </span>
                  </TD>
                  <TD className="text-end text-sm font-medium">{formatCurrency(Number(order.total))}</TD>
                  <TD className="text-end text-sm text-ink-soft">{formatDateTime(order.created_at)}</TD>
                  <TD className="text-end">
                    <button
                      className="rounded p-1 text-ink-soft transition-colors hover:bg-rail hover:text-ink"
                      aria-label={`${t("order")} ${order.order_number}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
