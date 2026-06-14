"use client";

import { Sidebar } from "./sidebar";
import { useUIStore } from "@/stores";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "ms-64" : "ms-16"
        )}
      >
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
