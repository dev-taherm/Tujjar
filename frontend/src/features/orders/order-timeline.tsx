"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/utils";

interface TimelineEntry {
  id: string;
  from_status: string;
  to_status: string;
  notes: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  processing: "bg-purple-500",
  shipped: "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  refunded: "bg-gray-500",
};

/**
 * Order status timeline: vertical history of status transitions from
 * GET /orders/orders/{id}/timeline/.
 */
export function OrderTimeline({ orderId }: { orderId: string }) {
  const t = useTranslations("dashboard.orders");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["orders", orderId, "timeline"],
    queryFn: async (): Promise<TimelineEntry[]> => {
      const { data } = await apiClient.get(`/orders/orders/${orderId}/timeline/`);
      return data.results || data;
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <p className="text-sm text-gray-400">
        {t("timelineEmpty", { defaultValue: "No status changes recorded yet." })}
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 ps-6">
      <span
        className="absolute bottom-2 start-[7px] top-2 w-px bg-gray-200"
        aria-hidden="true"
      />
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className={`absolute -start-6 top-1 h-4 w-4 rounded-full border-2 border-white ${
              statusColors[entry.to_status] || "bg-gray-400"
            }`}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                statusColors[entry.to_status] || "bg-gray-400"
              }`}
            >
              {entry.to_status}
            </span>
            <span className="text-xs text-gray-400">{formatDateTime(entry.created_at)}</span>
          </div>
          {entry.notes && <p className="mt-0.5 text-xs text-gray-500">{entry.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
