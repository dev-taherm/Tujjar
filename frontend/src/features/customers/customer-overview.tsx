"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@/shared/ui";
import { useUpdateCustomer } from "@/api/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Customer } from "@/shared/types";

interface CustomerOverviewProps {
  customer: Customer;
  customerId: string;
}

export function CustomerOverview({ customer, customerId }: CustomerOverviewProps) {
  const t = useTranslations("dashboard.customer");
  const tc = useTranslations("common");
  const updateCustomer = useUpdateCustomer();
  const [firstName, setFirstName] = useState(customer.first_name);
  const [lastName, setLastName] = useState(customer.last_name);
  const [phone, setPhone] = useState(customer.phone);
  const [company, setCompany] = useState(customer.company);
  const [notes, setNotes] = useState(customer.notes);

  const handleSave = async () => {
    await updateCustomer.mutateAsync({
      id: customerId,
      first_name: firstName,
      last_name: lastName,
      phone,
      company,
      notes,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t("firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label={t("lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input label={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label={t("company")} value={company} onChange={(e) => setCompany(e.target.value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("notesPlaceholder")}
            />
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={updateCustomer.isPending}>
            <Save className="me-2 h-4 w-4" /> {tc("save")}
          </Button>
        </div>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("stats")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("orders")}</span>
              <span className="font-medium">{customer.orders_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("totalSpent")}</span>
              <span className="font-medium">{formatCurrency(Number(customer.total_spent))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("loyaltyPoints")}</span>
              <span className="font-medium">{customer.loyalty_points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("joined")}</span>
              <span className="font-medium">{formatDateTime(customer.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
