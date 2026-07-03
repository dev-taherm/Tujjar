"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Badge } from "@/shared/ui";
import type { Plan } from "@/shared/types";

interface AdminPlan extends Plan {
  is_system: boolean;
  subscription_count: number;
}

interface PlanForm {
  name: string;
  slug: string;
  description: string;
  price: string;
  interval: string;
  trial_days: string;
  max_products: string;
  max_orders: string;
  max_storage_gb: string;
  max_ai_generations: string;
}

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "0",
    interval: "monthly", trial_days: "14",
    max_products: "100", max_orders: "1000", max_storage_gb: "5",
    max_ai_generations: "50",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: async () => {
      const { data } = await apiClient.get("/platform/plans/");
      return data;
    },
  });

  const createPlan = useMutation({
    mutationFn: async (plan: typeof form) => {
      const { data } = await apiClient.post("/platform/plans/", {
        ...plan,
        price: parseFloat(plan.price),
        trial_days: parseInt(plan.trial_days),
        max_products: parseInt(plan.max_products),
        max_orders: parseInt(plan.max_orders),
        max_storage_gb: parseInt(plan.max_storage_gb),
        max_ai_generations: parseInt(plan.max_ai_generations),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      setShowForm(false);
      setForm({ name: "", slug: "", description: "", price: "0", interval: "monthly", trial_days: "14", max_products: "100", max_orders: "1000", max_storage_gb: "5", max_ai_generations: "50" });
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...plan }: { id: string } & PlanForm) => {
      const { data } = await apiClient.patch(`/platform/plans/${id}/`, {
        ...plan,
        price: parseFloat(plan.price),
        trial_days: parseInt(plan.trial_days),
        max_products: parseInt(plan.max_products),
        max_orders: parseInt(plan.max_orders),
        max_storage_gb: parseInt(plan.max_storage_gb),
        max_ai_generations: parseInt(plan.max_ai_generations),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      setShowForm(false);
      setEditingPlan(null);
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/platform/plans/${id}/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });

  const startEdit = (plan: AdminPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name, slug: plan.slug, description: plan.description || "",
      price: String(plan.price), interval: plan.interval,
      trial_days: String(plan.trial_days),
      max_products: String(plan.max_products),
      max_orders: String(plan.max_orders),
      max_storage_gb: String(plan.max_storage_gb),
      max_ai_generations: String(plan.max_ai_generations),
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500">Manage pricing plans for the platform</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingPlan(null); }}>
          Create Plan
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">{editingPlan ? "Edit Plan" : "New Plan"}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Optional plan description..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price ($)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Interval</label>
              <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Trial Days</label>
              <input type="number" value={form.trial_days} onChange={(e) => setForm({ ...form, trial_days: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max Products</label>
              <input type="number" value={form.max_products} onChange={(e) => setForm({ ...form, max_products: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max Orders</label>
              <input type="number" value={form.max_orders} onChange={(e) => setForm({ ...form, max_orders: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Storage (GB)</label>
              <input type="number" value={form.max_storage_gb} onChange={(e) => setForm({ ...form, max_storage_gb: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">AI Generations</label>
              <input type="number" value={form.max_ai_generations} onChange={(e) => setForm({ ...form, max_ai_generations: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => editingPlan ? updatePlan.mutate({ id: editingPlan.id, ...form }) : createPlan.mutate(form)}>
              {editingPlan ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingPlan(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />)
        ) : (
          data?.results?.map((plan: AdminPlan) => (
            <div key={plan.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-2xl font-bold text-primary-600">${plan.price}<span className="text-sm font-normal text-gray-500">/{plan.interval}</span></p>
                </div>
                {plan.is_system && <Badge>System</Badge>}
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p>{plan.max_products} products</p>
                <p>{plan.max_orders} orders</p>
                <p>{plan.max_storage_gb} GB storage</p>
                <p>{plan.max_ai_generations} AI generations</p>
                <p>{plan.trial_days} day trial</p>
              </div>
              <p className="mt-2 text-xs text-gray-400">{plan.subscription_count} subscriptions</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(plan)}>Edit</Button>
                {!plan.is_system && (
                  <Button size="sm" variant="destructive" onClick={() => deletePlan.mutate(plan.id)}>Delete</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
