"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input, Badge, Dialog, EmptyState } from "@/shared/ui";
import { useAddresses, useCreateAddress, useDeleteAddress, useSetDefaultAddress } from "@/api/queries";
import { MapPin, Plus, Trash2, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Address } from "@/shared/types";

interface CustomerAddressesProps {
  customerId: string;
  storeId: string;
}

export function CustomerAddresses({ customerId, storeId }: CustomerAddressesProps) {
  const t = useTranslations("dashboard.customer");
  const tc = useTranslations("common");
  const { data: addresses = [], isLoading } = useAddresses(customerId);
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const resetForm = () => {
    setLabel("");
    setAddressLine1("");
    setCity("");
    setState("");
    setPostalCode("");
    setCountry("");
  };

  const handleCreate = async () => {
    await createAddress.mutateAsync({
      store: storeId,
      customer: customerId,
      label,
      address_line1: addressLine1,
      city,
      state,
      postal_code: postalCode,
      country,
    });
    setShowForm(false);
    resetForm();
  };

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("addresses")}</h2>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="me-1 h-4 w-4" /> {t("addAddress")}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title={t("noAddresses")} description={t("noAddressesDesc")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr: Address) => (
            <Card key={addr.id} className="relative">
              {addr.is_default && (
                <Badge variant="success" className="absolute right-3 top-3">
                  {t("default")}
                </Badge>
              )}
              <CardContent className="pt-6">
                <p className="font-medium">{addr.label}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {addr.address_line1}
                  {addr.address_line2 && `, ${addr.address_line2}`}
                </p>
                <p className="text-sm text-gray-600">
                  {addr.city}, {addr.state} {addr.postal_code}
                </p>
                <p className="text-sm text-gray-600">{addr.country}</p>
                <div className="mt-3 flex gap-2">
                  {!addr.is_default && (
                    <Button size="sm" variant="secondary" onClick={() => setDefault.mutate(addr.id)}>
                      <Check className="me-1 h-3 w-3" /> {t("setDefault")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => deleteAddress.mutate(addr.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title={t("addAddress")}>
        <div className="space-y-4">
          <Input label={t("addressLabel")} value={label} onChange={(e) => setLabel(e.target.value)} />
          <Input label={t("addressLine1")} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t("city")} value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label={t("state")} value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t("postalCode")} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            <Input label={t("country")} value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>{tc("cancel")}</Button>
            <Button onClick={handleCreate} isLoading={createAddress.isPending}>{tc("save")}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
