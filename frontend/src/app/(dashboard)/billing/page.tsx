import { Metadata } from "next";
import { BillingDashboard } from "@/features/billing/billing-dashboard";

export const metadata: Metadata = {
  title: "Billing - Tujjar",
  description: "Manage your subscription and billing",
};

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscriptions</h1>
        <p className="text-gray-500">Manage your plan, payment methods, and invoices</p>
      </div>
      <BillingDashboard />
    </div>
  );
}
