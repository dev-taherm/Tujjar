"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Select } from "@/shared/ui";
import { useUpdateOrderStatus, useShipOrder, useDeliverOrder, useCancelOrder } from "@/api/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Truck, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import type { Order } from "@/shared/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipShow, setShipShow] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: async (): Promise<Order> => {
      const { data } = await apiClient.get(`/orders/${orderId}/`);
      return data;
    },
    enabled: !!orderId,
  });

  const updateStatus = useUpdateOrderStatus();
  const shipOrder = useShipOrder();
  const deliverOrder = useDeliverOrder();
  const cancelOrder = useCancelOrder();

  if (isLoading) {
    return <div className="h-[400px] animate-pulse rounded-xl bg-gray-200" />;
  }

  if (!order) {
    return <div className="flex h-96 items-center justify-center"><p className="text-gray-500">Order not found.</p></div>;
  }

  const handleShip = async () => {
    await shipOrder.mutateAsync({ id: orderId, tracking_number: trackingNumber });
    setShipShow(false);
    setTrackingNumber("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-sm text-gray-500">Placed on {formatDateTime(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColors[order.status] || ""}`}>{order.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Items ({order.items.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gray-100" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                    </div>
                    <div className="text-end">
                      <p className="font-medium text-gray-900">{formatCurrency(Number(item.total_price))}</p>
                      <p className="text-sm text-gray-500">{item.quantity} x {formatCurrency(Number(item.unit_price))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{formatCurrency(Number(order.shipping_amount))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(Number(order.tax_amount))}</span></div>
              {Number(order.discount_amount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(Number(order.discount_amount))}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900"><span>Total</span><span>{formatCurrency(Number(order.total))}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select
                label="Status"
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "processing", label: "Processing" },
                  { value: "shipped", label: "Shipped" },
                  { value: "delivered", label: "Delivered" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
                value={order.status}
                onChange={(e) => updateStatus.mutateAsync({ id: orderId, status: e.target.value })}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShipShow(!shipShow)}><Truck className="me-1 h-4 w-4" /> Ship</Button>
                <Button variant="outline" size="sm" onClick={() => deliverOrder.mutateAsync(orderId)}><CheckCircle className="me-1 h-4 w-4" /> Deliver</Button>
                <Button variant="outline" size="sm" onClick={() => cancelOrder.mutateAsync(orderId)}><XCircle className="me-1 h-4 w-4" /> Cancel</Button>
              </div>
              {shipShow && (
                <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                  <input type="text" placeholder="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <Button size="sm" onClick={handleShip} isLoading={shipOrder.isPending}>Confirm Shipment</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium text-gray-900">{order.customer_first_name} {order.customer_last_name}</p>
              <p className="text-gray-500">{order.customer_email}</p>
              {order.customer_phone && <p className="text-gray-500">{order.customer_phone}</p>}
              {order.shipping_address_line1 && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <p className="font-medium text-gray-700">Shipping Address</p>
                  <p className="text-gray-500">{order.shipping_address_line1}</p>
                  {order.shipping_address_line2 && <p className="text-gray-500">{order.shipping_address_line2}</p>}
                  <p className="text-gray-500">{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
                  <p className="text-gray-500">{order.shipping_country}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
