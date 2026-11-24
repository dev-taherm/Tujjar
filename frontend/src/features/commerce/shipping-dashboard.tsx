"use client";

import { useState } from "react";
import { Button, Input, Label, Dialog, Badge, EmptyState, Select, Card } from "@/shared/ui";
import {
  useShippingZones,
  useCreateShippingZone,
  useDeleteShippingZone,
  useCreateShippingRate,
  useDeleteShippingRate,
} from "@/api/commerce";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Truck, Trash2, Plus, Globe } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ShippingDashboard() {
  const t = useTranslations("dashboard.shipping");
  const tc = useTranslations("common");
  const { data: zones, isLoading } = useShippingZones();
  const createZone = useCreateShippingZone();
  const deleteZone = useDeleteShippingZone();
  const createRate = useCreateShippingRate();
  const deleteRate = useDeleteShippingRate();

  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneCountries, setZoneCountries] = useState("");

  // rate form state per zone
  const [rateZoneId, setRateZoneId] = useState<string | null>(null);
  const [rateName, setRateName] = useState("");
  const [rateType, setRateType] = useState<"flat" | "percentage">("flat");
  const [ratePrice, setRatePrice] = useState("");
  const [rateFreeOver, setRateFreeOver] = useState("");

  const submitZone = async () => {
    if (!zoneName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    try {
      await createZone.mutateAsync({
        name: zoneName.trim(),
        countries: zoneCountries.trim().toUpperCase(),
        is_active: true,
      });
      toast.success(tc("saved"));
      setZoneDialogOpen(false);
      setZoneName("");
      setZoneCountries("");
    } catch {
      toast.error(tc("error"));
    }
  };

  const submitRate = async (zoneId: string) => {
    if (!rateName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    try {
      await createRate.mutateAsync({
        zone: zoneId,
        name: rateName.trim(),
        pricing_type: rateType,
        price: rateType === "flat" ? ratePrice || "0" : "0",
        percentage: rateType === "percentage" ? Number(ratePrice) || 0 : null,
        free_over: rateFreeOver || null,
        is_active: true,
      });
      toast.success(tc("saved"));
      setRateZoneId(null);
      setRateName("");
      setRatePrice("");
      setRateFreeOver("");
    } catch {
      toast.error(tc("error"));
    }
  };

  const removeZone = async (zoneId: string) => {
    try {
      await deleteZone.mutateAsync(zoneId);
      toast.success(tc("deleted"));
    } catch {
      toast.error(tc("error"));
    }
  };

  const removeRate = async (rateId: string) => {
    try {
      await deleteRate.mutateAsync(rateId);
      toast.success(tc("deleted"));
    } catch {
      toast.error(tc("error"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{t("description")}</p>
        <Button onClick={() => setZoneDialogOpen(true)}>
          <Plus className="me-2 h-4 w-4" /> {t("createZone")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : !zones?.length ? (
        <EmptyState icon={Truck} title={t("noZones")} description={t("noZonesHint")} />
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <Card key={zone.id} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                    <Globe className="h-3 w-3" />
                    {zone.countries || t("restOfWorld")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={zone.is_active ? "success" : "default"}>
                    {zone.is_active ? t("active") : t("inactive")}
                  </Badge>
                  <button
                    onClick={() => removeZone(zone.id)}
                    className="rounded p-1 text-red-400 hover:bg-red-50"
                    aria-label={tc("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {zone.rates.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{rate.name}</span>
                      <span className="ms-2 text-sm text-gray-500">
                        {rate.pricing_type === "percentage"
                          ? `${rate.percentage}%`
                          : formatCurrency(Number(rate.price))}
                        {rate.free_over ? ` · ${t("freeOver")} ${formatCurrency(Number(rate.free_over))}` : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => removeRate(rate.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      aria-label={tc("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {rateZoneId === zone.id ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`rate-name-${zone.id}`}>{t("rateName")}</Label>
                        <Input
                          id={`rate-name-${zone.id}`}
                          value={rateName}
                          onChange={(e) => setRateName(e.target.value)}
                          placeholder="Standard"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`rate-type-${zone.id}`}>{t("pricingType")}</Label>
                        <Select
                          id={`rate-type-${zone.id}`}
                          options={[
                            { value: "flat", label: t("flat") },
                            { value: "percentage", label: t("percentage") },
                          ]}
                          value={rateType}
                          onChange={(e) => setRateType(e.target.value as "flat" | "percentage")}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`rate-price-${zone.id}`}>
                          {rateType === "flat" ? t("price") : t("percentageLabel")}
                        </Label>
                        <Input
                          id={`rate-price-${zone.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={ratePrice}
                          onChange={(e) => setRatePrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`rate-free-${zone.id}`}>{t("freeOver")}</Label>
                        <Input
                          id={`rate-free-${zone.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={rateFreeOver}
                          onChange={(e) => setRateFreeOver(e.target.value)}
                          placeholder={t("optional")}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setRateZoneId(null)}>
                        {tc("cancel")}
                      </Button>
                      <Button size="sm" onClick={() => submitRate(zone.id)} isLoading={createRate.isPending}>
                        {tc("save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setRateZoneId(zone.id);
                      setRateName("");
                      setRatePrice("");
                      setRateFreeOver("");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" /> {t("addRate")}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={zoneDialogOpen} onClose={() => setZoneDialogOpen(false)} title={t("createZone")}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="zone-name">{t("zoneName")}</Label>
            <Input
              id="zone-name"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder={t("zoneNamePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="zone-countries">{t("countries")}</Label>
            <Input
              id="zone-countries"
              value={zoneCountries}
              onChange={(e) => setZoneCountries(e.target.value)}
              placeholder="SA, AE, KW"
            />
            <p className="mt-1 text-xs text-gray-500">{t("countriesHint")}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setZoneDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button onClick={submitZone} isLoading={createZone.isPending}>
              {tc("save")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
