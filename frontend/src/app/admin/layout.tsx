"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Store,
  CreditCard,
  Settings,
  Shield,
  LogOut,
  ArrowLeft,
} from "lucide-react";

const adminNav = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Organizations", href: "/admin/organizations", icon: Building2 },
  { name: "Stores", href: "/admin/stores", icon: Store },
  { name: "Plans", href: "/admin/plans", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user) {
      router.push("/login");
    } else if (!user.is_staff && !user.is_superuser) {
      router.push("/dashboard");
    }
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated || !isAuthenticated || !user || (!user.is_staff && !user.is_superuser)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4">
          <Shield className="h-6 w-6 text-red-600" />
          <span className="text-lg font-bold text-gray-900">Admin Panel</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-50 text-red-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
