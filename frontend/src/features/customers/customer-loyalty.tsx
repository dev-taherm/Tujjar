"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input, Textarea, Badge, Dialog } from "@/shared/ui";
import { useLoyaltyTransactions, useAdjustLoyalty } from "@/api/queries";
import { formatDateTime } from "@/lib/utils";
import { Award, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Customer, LoyaltyTransaction } from "@/shared/types";

interface CustomerLoyaltyProps {
  customer: Customer;
  customerId: string;
}

const TYPE_BADGE_VARIANT: Record<string, "success" | "warning" | "danger" | "info"> = {
  earned: "success",
  adjusted: "info",
  redeemed: "warning",
  expired: "danger",
};

export function CustomerLoyalty({ customer, customerId }: CustomerLoyaltyProps) {
  const t = useTranslations("dashboard.customer");
  const tc = useTranslations("common");
  const { data: transactions = [], isLoading } = useLoyaltyTransactions(customerId);
  const adjustLoyalty = useAdjustLoyalty();
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustDesc, setAdjustDesc] = useState("");

  const handleAdjust = async () => {
    await adjustLoyalty.mutateAsync({
      customer_id: customerId,
      points: adjustPoints,
      description: adjustDesc,
    });
    setShowAdjust(false);
    setAdjustPoints(0);
    setAdjustDesc("");
  };

  if (isLoading) return <div className="h-[300px] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("loyalty")}</h2>
        <Button onClick={() => setShowAdjust(true)} size="sm">
          <Plus className="me-1 h-4 w-4" /> {t("adjustPoints")}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Award className="h-10 w-10 text-yellow-500" />
            <div>
              <p className="text-3xl font-bold">{customer.loyalty_points}</p>
              <p className="text-sm text-gray-500">{t("currentBalance")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {transactions.length === 0 ? (
        <p className="py-8 text-center text-gray-500">{t("noTransactions")}</p>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">{t("date")}</th>
                  <th className="pb-2 font-medium">{t("type")}</th>
                  <th className="pb-2 font-medium">{t("points")}</th>
                  <th className="pb-2 font-medium">{t("balance")}</th>
                  <th className="pb-2 font-medium">{t("description")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: LoyaltyTransaction) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-3">{formatDateTime(tx.created_at)}</td>
                    <td className="py-3">
                      <Badge variant={TYPE_BADGE_VARIANT[tx.type] || "default"}>{tx.type}</Badge>
                    </td>
                    <td className={`py-3 font-medium ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.points > 0 ? "+" : ""}{tx.points}
                    </td>
                    <td className="py-3">{tx.balance}</td>
                    <td className="py-3 text-gray-500">{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdjust} onClose={() => setShowAdjust(false)} title={t("adjustPoints")}>
        <div className="space-y-4">
          <Input
            label={t("points")}
            type="number"
            value={adjustPoints}
            onChange={(e) => setAdjustPoints(Number(e.target.value))}
          />
          <Textarea
            label={t("reason")}
            value={adjustDesc}
            onChange={(e) => setAdjustDesc(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdjust(false)}>{tc("cancel")}</Button>
            <Button onClick={handleAdjust} isLoading={adjustLoyalty.isPending}>{tc("save")}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
