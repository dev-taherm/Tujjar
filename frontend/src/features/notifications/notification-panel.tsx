"use client";

import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/api/queries";
import { formatDateTime } from "@/lib/utils";
import { Bell, Check, CheckCheck, Package, ShoppingCart, CreditCard, Settings, Bot } from "lucide-react";

const typeIcons: Record<string, React.ElementType> = {
  order: ShoppingCart,
  product: Package,
  store: Settings,
  billing: CreditCard,
  system: Settings,
  ai: Bot,
  custom: Bell,
};

const typeColors: Record<string, string> = {
  order: "text-blue-600 bg-blue-50",
  product: "text-green-600 bg-green-50",
  store: "text-purple-600 bg-purple-50",
  billing: "text-orange-600 bg-orange-50",
  system: "text-gray-600 bg-gray-100",
  ai: "text-indigo-600 bg-indigo-50",
  custom: "text-gray-600 bg-gray-100",
};

export function NotificationPanel() {
  const { data: notifications } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-700" />
          <h2 className="font-semibold">Notifications</h2>
          {unreadData && unreadData.count > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unreadData.count}</span>
          )}
        </div>
        {(unreadData?.count ?? 0) > 0 && (
          <button onClick={() => markAllRead.mutate()} className="text-sm text-primary-600 hover:text-primary-700">
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {!notifications?.length ? (
          <div className="p-8 text-center text-sm text-gray-500">No notifications yet</div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcons[n.notification_type] || Bell;
            return (
              <div key={n.id} onClick={() => !n.is_read && markRead.mutate(n.id)} className={`flex gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${!n.is_read ? "bg-blue-50/30" : ""}`}>
                <div className={`rounded-lg p-2 ${typeColors[n.notification_type] || "text-gray-600 bg-gray-100"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                    {!n.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { data: unreadData } = useUnreadCount();
  return (
    <div className="relative">
      <Bell className="h-5 w-5 text-gray-500" />
      {unreadData && unreadData.count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
          {unreadData.count > 9 ? "9+" : unreadData.count}
        </span>
      )}
    </div>
  );
}
