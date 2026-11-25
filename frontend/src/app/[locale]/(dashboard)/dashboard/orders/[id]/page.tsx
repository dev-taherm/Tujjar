"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Select, PageHeader, Breadcrumbs } from "@/shared/ui";
import { useUpdateOrderStatus, useShipOrder, useDeliverOrder, useCancelOrder } from "@/api/queries";
import { useRefunds, useCreateRefund } from "@/api/commerce";
import { OrderTimeline } from "@/features/orders/order-timeline";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Truck, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order } from "@/shared/types";
import { Badge, Input } from "@/shared/ui";

const statusColors: Record<string, string> = {
  pending: "bg-warning-soft text-warning",
  confirmed: "bg-primary-100 text-primary-800",
  processing: "bg-info-soft text-info",
  shipped: "bg-info/20 text-info",
  delivered: "bg-success-soft text-success",
  cancelled: "bg-error-soft text-error",
  refunded: "bg-rail text-ink",
};

export default function OrderDetailPage() {
  const t = useTranslations("dashboard.orders");
  const locale = useLocale();
  const tc = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipShow, setShipShow] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: async (): Promise<Order> => {
      const { data } = await apiClient.get(`/orders/orders/${orderId}/`);
      return data;
    },
    enabled: !!orderId,
  });

  const updateStatus = useUpdateOrderStatus();
  const shipOrder = useShipOrder();
  const deliverOrder = useDeliverOrder();
  const cancelOrder = useCancelOrder();

  if (isLoading) {
    return <div className="h-[400px] shimmer rounded-xl" />;
  }

  if (!order) {
    return <div className="flex h-96 items-center justify-center"><p className="text-ink-soft">{t("notFound")}</p></div>;
  }

  const handleShip = async () => {
    await shipOrder.mutateAsync({ id: orderId, tracking_number: trackingNumber });
    setShipShow(false);
    setTrackingNumber("");
  };

  return (
    <div className="space-y-6 animate-rise">
      <Breadcrumbs
        items={[
          { label: t("title"), href: `/${locale}/dashboard/orders` },
          { label: order.order_number },
        ]}
      />
      <PageHeader
        title={order.order_number}
        description={`${t("placedOn")} ${formatDateTime(order.created_at)}`}
        className="mb-0"
        actions={
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColors[order.status] || ""}`}>
            {order.status}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("timeline", { defaultValue: "Timeline" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline orderId={orderId} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t("items")} ({order.items.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-line">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-rail" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-ink">{item.title}</p>
                      {item.sku && <p className="text-xs text-ink-soft">{t("sku")}: {item.sku}</p>}
                    </div>
                    <div className="text-end">
                      <p className="font-medium text-ink">{formatCurrency(Number(item.total_price))}</p>
                      <p className="text-sm text-ink-soft">{item.quantity} x {formatCurrency(Number(item.unit_price))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-soft">{t("subtotal")}</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-ink-soft">{t("shipping")}</span><span>{formatCurrency(Number(order.shipping_amount))}</span></div>
              <div className="flex justify-between"><span className="text-ink-soft">{t("tax")}</span><span>{formatCurrency(Number(order.tax_amount))}</span></div>
              {Number(order.discount_amount) > 0 && <div className="flex justify-between text-success"><span>{t("discount")}</span><span>-{formatCurrency(Number(order.discount_amount))}</span></div>}
              <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink"><span>{t("total")}</span><span>{formatCurrency(Number(order.total))}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("actions")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select
                label={t("statusLabel")}
                options={[
                  { value: "pending", label: t("pending") },
                  { value: "confirmed", label: t("confirmed") },
                  { value: "processing", label: t("processing") },
                  { value: "shipped", label: t("shipped") },
                  { value: "delivered", label: t("delivered") },
                  { value: "cancelled", label: t("cancelled") },
                ]}
                value={order.status}
                onChange={(e) => updateStatus.mutateAsync({ id: orderId, status: e.target.value })}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShipShow(!shipShow)}><Truck className="me-1 h-4 w-4" /> {t("ship")}</Button>
                <Button variant="outline" size="sm" onClick={() => deliverOrder.mutateAsync(orderId)}><CheckCircle className="me-1 h-4 w-4" /> {t("deliver")}</Button>
                <Button variant="outline" size="sm" onClick={() => cancelOrder.mutateAsync(orderId)}><XCircle className="me-1 h-4 w-4" /> {tc("cancel")}</Button>
              </div>
              {shipShow && (
                <div className="space-y-2 rounded-lg border border-line p-3">
                  <input type="text" placeholder={t("trackingNumber")} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
                  <Button size="sm" onClick={handleShip} isLoading={shipOrder.isPending}>{t("confirmShipment")}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("customer")}</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium text-ink">{order.customer_first_name} {order.customer_last_name}</p>
              <p className="text-ink-soft">{order.customer_email}</p>
              {order.customer_phone && <p className="text-ink-soft">{order.customer_phone}</p>}
              {order.shipping_address_line1 && (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="font-medium text-ink">{t("shippingAddress")}</p>
                  <p className="text-ink-soft">{order.shipping_address_line1}</p>
                  {order.shipping_address_line2 && <p className="text-ink-soft">{order.shipping_address_line2}</p>}
                  <p className="text-ink-soft">{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
                  <p className="text-ink-soft">{order.shipping_country}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <RefundsCard orderId={orderId} orderTotal={Number(order.total)} orderStatus={order.status} />
        </div>
      </div>
    </div>
  );
}

function RefundsCard({
  orderId,
  orderTotal,
  orderStatus,
}: {
  orderId: string;
  orderTotal: number;
  orderStatus: string;
}) {
  const t = useTranslations("dashboard.refunds");
  const tc = useTranslations("common");
  const { data: refunds, isLoading } = useRefunds({ order: orderId });
  const createRefund = useCreateRefund();

  const [show, setShow] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(false);

  const refunded = (refunds || [])
    .filter((r) => r.status === "succeeded")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const refundable = Math.max(orderTotal - refunded, 0);
  const canRefund = refundable > 0 && orderStatus !== "cancelled";

  const submit = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error(t("amountRequired"));
      return;
    }
    try {
      await createRefund.mutateAsync({
        order: orderId,
        amount: value.toFixed(2),
        reason: reason,
        restock,
      });
      toast.success(tc("saved"));
      setShow(false);
      setAmount("");
      setReason("");
      setRestock(false);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || tc("error");
      toast.error(detail);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>{t("title")}</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading ? (
          <div className="h-10 shimmer rounded" />
        ) : !refunds?.length ? (
          <p className="text-ink-soft">{t("noRefunds")}</p>
        ) : (
          <div className="space-y-2">
            {refunds.map((refund) => (
              <div key={refund.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                <div>
                  <span className="font-medium text-ink">{formatCurrency(Number(refund.amount))}</span>
                  {refund.reason && <span className="ms-2 text-xs text-ink-soft">{refund.reason}</span>}
                </div>
                <Badge variant={refund.status === "succeeded" ? "success" : refund.status === "failed" ? "danger" : "warning"}>
                  {refund.status}
                </Badge>
              </div>
            ))}
            <div className="text-xs text-ink-soft">
              {t("refundedTotal")}: {formatCurrency(refunded)} · {t("refundable")}: {formatCurrency(refundable)}
            </div>
          </div>
        )}

        {canRefund &&
          (show ? (
            <div className="space-y-2 rounded-lg border border-line p-3">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                max={refundable}
                placeholder={t("amount")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Input
                placeholder={t("reason")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
                {t("restock")}
              </label>
              <div className="flex gap-2">
                <Button size="sm" onClick={submit} isLoading={createRefund.isPending}>
                  {t("confirmRefund")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShow(false)}>
                  {tc("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShow(true)}>
              {t("createRefund")}
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}
