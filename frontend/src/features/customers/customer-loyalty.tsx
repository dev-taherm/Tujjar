"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input, Textarea, Badge, Dialog, Table, THead, THeadCell, TBody, TR, TD } from "@/shared/ui";
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

  if (isLoading) return <div className="h-[300px] shimmer rounded-xl" />;

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
            <Award className="h-10 w-10 text-warning" />
            <div>
              <p className="text-3xl font-bold">{customer.loyalty_points}</p>
              <p className="text-sm text-ink-soft">{t("currentBalance")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {transactions.length === 0 ? (
        <p className="py-8 text-center text-ink-soft">{t("noTransactions")}</p>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <THead>
                <tr>
                  <THeadCell>{t("date")}</THeadCell>
                  <THeadCell>{t("type")}</THeadCell>
                  <THeadCell className="text-end">{t("points")}</THeadCell>
                  <THeadCell className="text-end">{t("balance")}</THeadCell>
                  <THeadCell>{t("description")}</THeadCell>
                </tr>
              </THead>
              <TBody>
                {transactions.map((tx: LoyaltyTransaction) => (
                  <TR key={tx.id}>
                    <TD className="text-sm">{formatDateTime(tx.created_at)}</TD>
                    <TD>
                      <Badge variant={TYPE_BADGE_VARIANT[tx.type] || "default"}>{tx.type}</Badge>
                    </TD>
                    <TD className={`text-end text-sm font-medium tabular-nums ${tx.points > 0 ? "text-success" : "text-error"}`}>
                      {tx.points > 0 ? "+" : ""}{tx.points}
                    </TD>
                    <TD className="text-end text-sm tabular-nums">{tx.balance}</TD>
                    <TD className="text-sm text-ink-soft">{tx.description}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
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
