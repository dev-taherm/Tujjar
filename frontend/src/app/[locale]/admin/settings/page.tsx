"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button } from "@/shared/ui";
import { Toggle } from "@/shared/components/toggle";
import { useMemo } from "react";

interface ConfigItem {
  id: string;
  key: string;
  value: string | number | boolean;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "config"],
    queryFn: async () => {
      const { data } = await apiClient.get("/platform/config/");
      return data;
    },
  });

  const configs = useMemo(() => {
    if (!data?.results) return {};
    const map: Record<string, ConfigItem> = {};
    data.results.forEach((c: ConfigItem) => { map[c.key] = c; });
    return map;
  }, [data]);

  const updateConfig = useMutation({
    mutationFn: async ({ key, value, id }: { key: string; value: string | number | boolean; id?: string }) => {
      if (id) {
        const { data } = await apiClient.patch(`/platform/config/${id}/`, { value });
        return data;
      } else {
        const { data } = await apiClient.post("/platform/config/", { key, value });
        return data;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "config"] }),
  });

  const toggleSetting = (key: string, currentValue: boolean) => {
    const config = configs[key];
    updateConfig.mutate({ key, value: !currentValue, id: config?.id });
  };

  const updateText = (key: string, value: string) => {
    const config = configs[key];
    updateConfig.mutate({ key, value, id: config?.id });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500">Configure your Tujjar platform</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">General</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Site Name</label>
              <input
                type="text"
                defaultValue={String(configs.site_name?.value || "Tujjar")}
                onBlur={(e) => updateText("site_name", e.target.value)}
                className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900">Access Control</h2>
          <div className="mt-4 space-y-4">
            <Toggle
                label="Public Registration"
                description="Allow new users to sign up"
                enabled={configs.registration_enabled?.value !== false}
                onToggle={() => toggleSetting("registration_enabled", Boolean(configs.registration_enabled?.value ?? true))}
              />

            <Toggle
                label="Maintenance Mode"
                description="Temporarily disable access to the platform"
                enabled={!!configs.maintenance_mode?.value}
                onToggle={() => toggleSetting("maintenance_mode", Boolean(configs.maintenance_mode?.value ?? false))}
              />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900">Defaults</h2>
          <div className="mt-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Default Trial Days</label>
              <input
                type="number"
                defaultValue={Number(configs.default_trial_days?.value || 14)}
                onBlur={(e) => updateText("default_trial_days", e.target.value)}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
