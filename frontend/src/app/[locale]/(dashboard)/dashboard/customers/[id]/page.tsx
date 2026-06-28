"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { CustomerDetailTabs } from "@/features/customers/customer-detail-tabs";
import type { Customer } from "@/shared/types";

export default function CustomerDetailPage() {
  const t = useTranslations("dashboard.customer");
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customers", customerId],
    queryFn: async (): Promise<Customer> => {
      const { data } = await apiClient.get(`/customers/${customerId}/`);
      return data;
    },
    enabled: !!customerId,
  });

  if (isLoading) return <div className="h-[400px] animate-pulse rounded-xl bg-gray-200" />;

  if (!customer)
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">{t("notFound")}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
        </div>
      </div>

      <CustomerDetailTabs customer={customer} customerId={customerId} />
    </div>
  );
}
