"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { notificationsApi } from "@/api/notifications";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

const ROUTE_BY_TYPE: Record<string, string> = {
  order: "/dashboard/orders",
  product: "/dashboard/products",
  customer: "/dashboard/customers",
};

/**
 * Dashboard notifications bell: polls unread count, shows a dropdown with
 * recent notifications, mark-read / mark-all-read actions, and routes to
 * the related entity page when a notification links to one.
 */
export function NotificationsBell() {
  const t = useTranslations("dashboard.notifications");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30_000,
  });

  const { data: recent } = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => notificationsApi.getNotifications(),
    enabled: open,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const count = unread?.count ?? 0;

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      /* silent */
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      /* silent */
    }
  };

  const openNotification = (n: NotificationRow) => {
    if (!n.is_read) markRead(n.id);
    const route = ROUTE_BY_TYPE[n.notification_type || ""];
    if (route && n.entity_id) {
      setOpen(false);
      router.push(`${route}/${n.entity_id}`);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-ink-soft transition-colors hover:bg-rail"
        aria-label={t("title")}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 z-50 mt-2 w-80 rounded-xl border border-line bg-panel shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">{t("title")}</span>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
              >
                <CheckCheck className="h-3.5 w-3.5" /> {t("markAllRead")}
              </button>
            )}
          </div>
          <div className="max-h-96 divide-y divide-line overflow-y-auto">
            {!recent?.length ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">{t("empty")}</p>
            ) : (
              recent.slice(0, 10).map((n: NotificationRow) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 px-4 py-3 text-start transition-colors hover:bg-rail",
                    !n.is_read && "bg-primary-50/50"
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        n.is_read ? "font-normal text-ink" : "font-semibold text-ink"
                      )}
                    >
                      {n.title}
                    </span>
                    {!n.is_read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />}
                  </span>
                  <span className="line-clamp-1 text-xs text-ink-soft">{n.message}</span>
                  <span className="text-[10px] text-ink-soft">{formatDateTime(n.created_at)}</span>
                </button>
              ))
            )}
          </div>
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-2 text-center text-xs text-primary-600 hover:bg-rail"
          >
            {t("viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}

export function MarkAllReadButton() {
  return (
    <button className="flex items-center gap-1 text-xs text-primary-600">
      <Check className="h-3 w-3" /> mark
    </button>
  );
}
