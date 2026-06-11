import { Metadata } from "next";
import { AnalyticsDashboard } from "@/features/analytics/analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics - Tujjar",
  description: "View your store analytics and insights",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500">Track your store performance and customer behavior</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
