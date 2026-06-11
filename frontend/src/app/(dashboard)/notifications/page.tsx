import { Metadata } from "next";
import { NotificationPanel } from "@/features/notifications/notification-panel";

export const metadata: Metadata = {
  title: "Notifications - Tujjar",
  description: "View your notifications",
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-gray-500">Stay updated with your store activity</p>
      </div>
      <div className="flex justify-center">
        <NotificationPanel />
      </div>
    </div>
  );
}
