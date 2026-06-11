"use client";

import { DashboardLayout } from "@/shared/layouts/dashboard-layout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
