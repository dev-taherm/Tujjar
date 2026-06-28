"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/shared/layouts/dashboard-layout";
import { ErrorBoundary } from "@/shared/components/error-boundary";
import { useAuthStore } from "@/stores";
import { useLocale } from "next-intl";

const emptySubscribe = () => () => {};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const locale = useLocale();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [hydrated, isAuthenticated, router, locale]);

  if (!hydrated || !isAuthenticated) {
    return null;
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>{children}</DashboardLayout>
    </ErrorBoundary>
  );
}
