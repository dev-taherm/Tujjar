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
  pending: "bg-warning",
  confirmed: "bg-primary-500",
  processing: "bg-purple-500",
  shipped: "bg-info",
  delivered: "bg-success",
  cancelled: "bg-error",
  refunded: "bg-ink-soft",
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
          <div key={i} className="h-10 shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <p className="text-sm text-ink-soft">
        {t("timelineEmpty", { defaultValue: "No status changes recorded yet." })}
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 ps-6">
      <span
        className="absolute bottom-2 start-[7px] top-2 w-px bg-rail"
        aria-hidden="true"
      />
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className={`absolute -start-6 top-1 h-4 w-4 rounded-full border-2 border-white ${
              statusColors[entry.to_status] || "bg-ink-soft"
            }`}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                statusColors[entry.to_status] || "bg-ink-soft"
              }`}
            >
              {entry.to_status}
            </span>
            <span className="text-xs text-ink-soft">{formatDateTime(entry.created_at)}</span>
          </div>
          {entry.notes && <p className="mt-0.5 text-xs text-ink-soft">{entry.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
