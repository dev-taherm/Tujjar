"use client";

import { useState } from "react";
import { Button, Input, Label, Dialog, Badge, EmptyState, Table, THead, THeadCell, TBody, TR, TD } from "@/shared/ui";
import {
  useTaxRates,
  useCreateTaxRate,
  useUpdateTaxRate,
  useDeleteTaxRate,
  type TaxRate,
} from "@/api/commerce";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Receipt, Trash2, Plus } from "lucide-react";

interface FormState {
  name: string;
  rate: string;
  country: string;
  state: string;
  postal_code: string;
  inclusive: boolean;
  is_default: boolean;
}

const emptyForm: FormState = {
  name: "",
  rate: "15",
  country: "",
  state: "",
  postal_code: "",
  inclusive: false,
  is_default: false,
};

export function TaxesDashboard() {
  const t = useTranslations("dashboard.taxes");
  const tc = useTranslations("common");
  const { data: taxes, isLoading } = useTaxRates();
  const createMutation = useCreateTaxRate();
  const updateMutation = useUpdateTaxRate();
  const deleteMutation = useDeleteTaxRate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (tax: TaxRate) => {
    setEditing(tax);
    setForm({
      name: tax.name,
      rate: tax.rate,
      country: tax.country,
      state: tax.state,
      postal_code: tax.postal_code,
      inclusive: tax.inclusive,
      is_default: tax.is_default,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    const payload = {
      name: form.name.trim(),
      rate: form.rate,
      country: form.country.trim().toUpperCase(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim(),
      inclusive: form.inclusive,
      is_default: form.is_default,
      is_active: true,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      toast.success(tc("saved"));
      setDialogOpen(false);
    } catch {
      toast.error(tc("error"));
    }
  };

  const toggleActive = async (tax: TaxRate) => {
    try {
      await updateMutation.mutateAsync({ id: tax.id, payload: { is_active: !tax.is_active } });
    } catch {
      toast.error(tc("error"));
    }
  };

  const remove = async (tax: TaxRate) => {
    try {
      await deleteMutation.mutateAsync(tax.id);
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
            <div key={i} className="h-14 shimmer rounded-lg" />
          ))}
        </div>
      ) : !taxes?.length ? (
        <EmptyState icon={Receipt} title={t("noRates")} description={t("noRatesHint")} />
      ) : (
        <Table>
          <THead>
            <tr>
              <THeadCell>{t("name")}</THeadCell>
              <THeadCell>{t("rate")}</THeadCell>
              <THeadCell>{t("appliesTo")}</THeadCell>
              <THeadCell>{t("mode")}</THeadCell>
              <THeadCell>{t("statusLabel")}</THeadCell>
              <THeadCell className="w-24" />
            </tr>
          </THead>
          <TBody>
            {taxes.map((tax) => (
              <TR key={tax.id}>
                <TD className="text-sm font-medium">{tax.name}</TD>
                <TD className="text-sm text-ink-soft tabular-nums">{tax.rate}%</TD>
                <TD className="text-sm text-ink-soft">
                  {[tax.postal_code, tax.state, tax.country].filter(Boolean).join(" · ") ||
                    t("everywhere")}
                </TD>
                <TD className="text-sm text-ink-soft">
                  {tax.inclusive ? t("inclusive") : t("exclusive")}
                </TD>
                <TD>
                  <button onClick={() => toggleActive(tax)} title={t("toggleStatus")}>
                    <Badge variant={tax.is_active ? "success" : "default"}>
                      {tax.is_active ? t("active") : t("inactive")}
                    </Badge>
                  </button>
                </TD>
                <TD className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(tax)}
                      className="rounded px-2 py-1 text-xs text-ink-soft transition-colors hover:bg-rail hover:text-ink"
                    >
                      {tc("edit")}
                    </button>
                    <button
                      onClick={() => remove(tax)}
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
            <Label htmlFor="tax-name">{t("name")}</Label>
            <Input
              id="tax-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VAT"
            />
          </div>
          <div>
            <Label htmlFor="tax-rate">{t("rate")}</Label>
            <Input
              id="tax-rate"
              type="number"
              min="0"
              step="0.01"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="tax-country">{t("country")}</Label>
              <Input
                id="tax-country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="SA"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="tax-state">{t("state")}</Label>
              <Input
                id="tax-state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tax-postal">{t("postalCode")}</Label>
              <Input
                id="tax-postal"
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.inclusive}
                onChange={(e) => setForm({ ...form, inclusive: e.target.checked })}
              />
              {t("inclusive")}
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              />
              {t("isDefault")}
            </label>
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
