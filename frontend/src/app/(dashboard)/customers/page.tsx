"use client";

import { CustomerList } from "@/features/orders/customer-list";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">View and manage your customer data.</p>
      </div>
      <CustomerList />
    </div>
  );
}
