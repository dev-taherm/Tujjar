"use client";

import { Sidebar } from "./sidebar";
import { VerificationBanner } from "@/shared/components/verification-banner";
import { useUIStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleMobile } = useUIStore();

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="sticky top-0 z-30 flex h-14 items-center border-b border-gray-200 bg-white px-4 md:hidden">
        <button
          onClick={toggleMobile}
          className="rounded-lg p-1.5 hover:bg-gray-100 active:scale-[0.98] active:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="ms-3 text-lg font-bold text-primary-600">Tujjar</span>
      </div>
      <Sidebar />
      <main
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "md:ms-64" : "md:ms-16"
        )}
      >
        <VerificationBanner />
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
