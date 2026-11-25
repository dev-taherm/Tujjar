"use client";

import { useState } from "react";
import { Button, Input, Label, Select, Dialog, Badge, EmptyState, Table, THead, THeadCell, TBody, TR, TD } from "@/shared/ui";
import {
  useDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
  type Discount,
} from "@/api/commerce";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tag, Trash2, Pencil, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const typeOptions = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed amount" },
  { value: "free_shipping", label: "Free shipping" },
];

interface FormState {
  code: string;
  description: string;
  type: Discount["type"];
  value: string;
  min_subtotal: string;
  max_uses: string;
  valid_until: string;
}

const emptyForm: FormState = {
  code: "",
  description: "",
  type: "percentage",
  value: "10",
  min_subtotal: "0",
  max_uses: "",
  valid_until: "",
};

export function DiscountsDashboard() {
  const t = useTranslations("dashboard.discounts");
  const tc = useTranslations("common");
  const { data: discounts, isLoading } = useDiscounts();
  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount();
  const deleteMutation = useDeleteDiscount();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (discount: Discount) => {
    setEditing(discount);
    setForm({
      code: discount.code,
      description: discount.description,
      type: discount.type,
      value: discount.value,
      min_subtotal: discount.min_subtotal,
      max_uses: discount.max_uses != null ? String(discount.max_uses) : "",
      valid_until: discount.valid_until ? discount.valid_until.slice(0, 10) : "",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.code.trim()) {
      toast.error(t("codeRequired"));
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description,
      type: form.type,
      value: form.type === "free_shipping" ? "0" : form.value,
      min_subtotal: form.min_subtotal || "0",
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success(tc("saved"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(tc("saved"));
      }
      setDialogOpen(false);
    } catch {
      toast.error(tc("error"));
    }
  };

  const toggleActive = async (discount: Discount) => {
    try {
      await updateMutation.mutateAsync({ id: discount.id, payload: { is_active: !discount.is_active } });
    } catch {
      toast.error(tc("error"));
    }
  };

  const remove = async (discount: Discount) => {
    try {
      await deleteMutation.mutateAsync(discount.id);
      toast.success(tc("deleted"));
    } catch {
      toast.error(tc("error"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{t("description")}</p>
        <Button onClick={openCreate}>
          <Plus className="me-2 h-4 w-4" /> {t("create")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 shimmer rounded-lg" />
          ))}
        </div>
      ) : !discounts?.length ? (
        <EmptyState icon={Tag} title={t("noDiscounts")} description={t("noDiscountsHint")} />
      ) : (
        <Table>
          <THead>
            <tr>
              <THeadCell>{t("code")}</THeadCell>
              <THeadCell>{t("type")}</THeadCell>
              <THeadCell>{t("usage")}</THeadCell>
              <THeadCell>{t("expires")}</THeadCell>
              <THeadCell>{t("statusLabel")}</THeadCell>
              <THeadCell className="w-20" />
            </tr>
          </THead>
          <TBody>
            {discounts.map((discount) => (
              <TR key={discount.id}>
                <TD>
                  <span className="font-mono text-sm font-medium">{discount.code}</span>
                  {discount.description && (
                    <p className="text-xs text-ink-soft">{discount.description}</p>
                  )}
                </TD>
                <TD className="text-sm text-ink-soft">
                  {discount.type === "percentage" && `${discount.value}%`}
                  {discount.type === "fixed" && `$${discount.value}`}
                  {discount.type === "free_shipping" && t("typeFreeShipping")}
                </TD>
                <TD className="text-sm text-ink-soft tabular-nums">
                  {discount.used_count}
                  {discount.max_uses != null ? ` / ${discount.max_uses}` : ""}
                </TD>
                <TD className="text-sm text-ink-soft">
                  {discount.valid_until ? formatDateTime(discount.valid_until) : "—"}
                </TD>
                <TD>
                  <button onClick={() => toggleActive(discount)} title={t("toggleStatus")}>
                    <Badge variant={discount.is_active ? "success" : "default"}>
                      {discount.is_active ? t("active") : t("inactive")}
                    </Badge>
                  </button>
                </TD>
                <TD className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(discount)}
                      className="rounded p-1 text-ink-soft transition-colors hover:bg-rail hover:text-ink"
                      aria-label={tc("edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(discount)}
                      className="rounded p-1 text-error transition-colors hover:bg-error-soft"
                      aria-label={tc("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? t("edit") : t("create")}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="discount-code">{t("code")}</Label>
            <Input
              id="discount-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="SUMMER20"
            />
          </div>
          <div>
            <Label htmlFor="discount-type">{t("type")}</Label>
            <Select
              id="discount-type"
              options={typeOptions}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Discount["type"] })}
            />
          </div>
          {form.type !== "free_shipping" && (
            <div>
              <Label htmlFor="discount-value">{form.type === "percentage" ? t("percentOff") : t("amountOff")}</Label>
              <Input
                id="discount-value"
                type="number"
                min="0"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
          )}
          <div>
            <Label htmlFor="discount-min">{t("minSubtotal")}</Label>
            <Input
              id="discount-min"
              type="number"
              min="0"
              value={form.min_subtotal}
              onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount-max-uses">{t("maxUses")}</Label>
              <Input
                id="discount-max-uses"
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="∞"
              />
            </div>
            <div>
              <Label htmlFor="discount-until">{t("expires")}</Label>
              <Input
                id="discount-until"
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="discount-desc">{t("descriptionLabel")}</Label>
            <Input
              id="discount-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button onClick={submit} isLoading={createMutation.isPending || updateMutation.isPending}>
              {tc("save")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
