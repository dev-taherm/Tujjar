"use client";

import type { Plan } from "@/shared/types";
import { usePlans, useSubscription, useInvoices, usePaymentMethods, useBillingCheckout } from "@/api/queries";
import { Badge, Button } from "@/shared/ui";
import { formatDateTime } from "@/lib/utils";
import { CreditCard, Check, Crown, Receipt, ArrowRight } from "lucide-react";

function PlanCard({ plan, currentPlanSlug }: { plan: Plan; currentPlanSlug?: string }) {
  const checkout = useBillingCheckout();
  const isCurrent = plan.slug === currentPlanSlug;

  return (
    <div className={`rounded-xl border-2 p-6 transition-colors ${isCurrent ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">{plan.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
        </div>
        {isCurrent && <Badge variant="success">Current</Badge>}
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold">${plan.price}</span>
        <span className="text-gray-500">/{plan.interval}</span>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.max_products} products</div>
        <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.max_orders} orders/mo</div>
        <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.max_storage_gb}GB storage</div>
        <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.max_ai_generations} AI generations/mo</div>
        {plan.features.map((f: string, i: number) => (
          <div key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{f}</div>
        ))}
      </div>
      {!isCurrent && (
        <Button className="mt-6 w-full" onClick={() => checkout.mutate({ planSlug: plan.slug, successUrl: window.location.href, cancelUrl: window.location.href })}>
          {checkout.isPending ? "Processing..." : "Select Plan"} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function SubscriptionCard() {
  const { data: sub } = useSubscription();
  if (!sub) return null;

  const statusColors: Record<string, string> = {
    active: "success", trialing: "info", past_due: "warning", canceled: "danger", unpaid: "danger",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3 mb-4">
        <Crown className="h-5 w-5 text-yellow-500" />
        <h3 className="font-semibold">Current Subscription</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500">Plan</span><p className="font-medium">{sub.plan_name}</p></div>
        <div><span className="text-gray-500">Status</span><p><Badge variant={(statusColors[sub.status] || "default") as "success"}>{sub.status}</Badge></p></div>
        <div><span className="text-gray-500">Price</span><p className="font-medium">${sub.plan_price}/mo</p></div>
        <div><span className="text-gray-500">Current Period</span><p>{formatDateTime(sub.current_period_start)} - {formatDateTime(sub.current_period_end)}</p></div>
      </div>
    </div>
  );
}

function InvoiceList() {
  const { data: invoices } = useInvoices();
  if (!invoices?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 p-4">
        <Receipt className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold">Invoices</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{inv.invoice_number}</p>
              <p className="text-gray-500">{formatDateTime(inv.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">${inv.amount}</p>
              <Badge variant={inv.status === "paid" ? "success" : inv.status === "open" ? "warning" : "default"}>{inv.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentMethodsCard() {
  const { data: methods } = usePaymentMethods();
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold">Payment Methods</h3>
      </div>
      {!methods?.length ? (
        <p className="text-sm text-gray-500">No payment methods saved</p>
      ) : (
        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{m.brand} ****{m.last_four}</p>
                  <p className="text-xs text-gray-500">Expires {m.exp_month}/{m.exp_year}</p>
                </div>
              </div>
              {m.is_default && <Badge variant="success">Default</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BillingDashboard() {
  const { data: plans } = usePlans();
  const { data: sub } = useSubscription();

  return (
    <div className="space-y-8">
      <SubscriptionCard />
      <PaymentMethodsCard />
      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Plans</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans?.map((plan: Plan) => (
            <PlanCard key={plan.id} plan={plan} currentPlanSlug={sub?.plan_name} />
          ))}
        </div>
      </div>
      <InvoiceList />
    </div>
  );
}
