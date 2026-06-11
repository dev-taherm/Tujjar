"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Palette,
  Image,
  BarChart3,
  CreditCard,
  Settings,
  Bot,
  Bell,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useAuthStore, useUIStore } from "@/stores";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Stores", href: "/dashboard/stores", icon: Store },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Pages", href: "/dashboard/pages", icon: FileText },
  { name: "Themes", href: "/dashboard/themes", icon: Palette },
  { name: "Marketplace", href: "/dashboard/marketplace", icon: Palette },
  { name: "Media", href: "/dashboard/media", icon: Image },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "AI", href: "/dashboard/ai", icon: Bot },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, organization } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {sidebarOpen && (
            <Link href="/dashboard" className="text-xl font-bold text-primary-600">
              Tujjar
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronLeft
              className={cn("h-5 w-5 transition-transform", !sidebarOpen && "rotate-180")}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-4">
          {sidebarOpen && user && (
            <div className="mb-3">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.full_name || user.email}
              </p>
              {organization && (
                <p className="truncate text-xs text-gray-500">{organization.name}</p>
              )}
            </div>
          )}
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
