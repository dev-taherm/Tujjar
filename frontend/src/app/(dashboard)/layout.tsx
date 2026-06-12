"use client";

import { DashboardLayout } from "@/shared/layouts/dashboard-layout";
import { ErrorBoundary } from "@/shared/components/error-boundary";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout>{children}</DashboardLayout>
    </ErrorBoundary>
  );
}
