"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useLocale, useTranslations } from "next-intl";
import { Breadcrumbs, PageHeader } from "@/shared/ui";
import { CustomerDetailTabs } from "@/features/customers/customer-detail-tabs";
import type { Customer } from "@/shared/types";

export default function CustomerDetailPage() {
  const t = useTranslations("dashboard.customer");
  const locale = useLocale();
  const params = useParams();
  const customerId = params.id as string;

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customers", customerId],
    queryFn: async (): Promise<Customer> => {
      const { data } = await apiClient.get(`/customers/${customerId}/`);
      return data;
    },
    enabled: !!customerId,
  });

  if (isLoading) return <div className="h-[400px] shimmer rounded-xl" />;

  if (!customer)
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-ink-soft">{t("notFound")}</p>
      </div>
    );

  return (
    <div className="space-y-6 animate-rise">
      <Breadcrumbs
        items={[
          { label: t("title"), href: `/${locale}/dashboard/customers` },
          { label: `${customer.first_name} ${customer.last_name}` },
        ]}
      />
      <PageHeader
        title={`${customer.first_name} ${customer.last_name}`}
        description={customer.email}
        className="mb-0"
      />

      <CustomerDetailTabs customer={customer} customerId={customerId} />
    </div>
  );
}
