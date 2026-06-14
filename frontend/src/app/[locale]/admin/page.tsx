"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Users, Building2, Store, DollarSign, UserPlus } from "lucide-react";

interface DashboardStats {
  total_users: number;
  new_users_30d: number;
  total_organizations: number;
  active_organizations: number;
  total_stores: number;
  active_stores: number;
  total_subscriptions: number;
  active_subscriptions: number;
  total_revenue: string;
  recent_users: Array<{
    id: string;
    email: string;
    full_name: string;
    is_staff: boolean;
    created_at: string;
  }>;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async (): Promise<DashboardStats> => {
      const { data } = await apiClient.get("/platform/dashboard/");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Organizations", value: stats?.total_organizations ?? 0, icon: Building2, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Stores", value: stats?.total_stores ?? 0, icon: Store, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Revenue", value: `$${stats?.total_revenue ?? "0"}`, icon: DollarSign, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "New Users (30d)", value: stats?.new_users_30d ?? 0, icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Active Orgs", value: stats?.active_organizations ?? 0, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Stores", value: stats?.active_stores ?? 0, icon: Store, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Active Subscriptions", value: stats?.active_subscriptions ?? 0, icon: DollarSign, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500">Manage your Tujjar platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {stats?.recent_users?.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.full_name || u.email}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {u.is_staff && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Admin
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {!stats?.recent_users?.length && (
            <div className="px-6 py-8 text-center text-sm text-gray-500">No users yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
