"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button } from "@/shared/ui";
import { useState, useEffect } from "react";

interface ConfigItem {
  id: string;
  key: string;
  value: string | number | boolean;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<Record<string, ConfigItem>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "config"],
    queryFn: async () => {
      const { data } = await apiClient.get("/platform/config/");
      return data;
    },
  });

  useEffect(() => {
    if (data?.results) {
      const map: Record<string, ConfigItem> = {};
      data.results.forEach((c: ConfigItem) => { map[c.key] = c; });
      setConfigs(map);
    }
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Public Registration</p>
                <p className="text-xs text-gray-500">Allow new users to sign up</p>
              </div>
              <button
                onClick={() => toggleSetting("registration_enabled", Boolean(configs.registration_enabled?.value ?? true))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  configs.registration_enabled?.value !== false ? "bg-primary-600" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  configs.registration_enabled?.value !== false ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-xs text-gray-500">Temporarily disable access to the platform</p>
              </div>
              <button
                onClick={() => toggleSetting("maintenance_mode", Boolean(configs.maintenance_mode?.value ?? false))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  configs.maintenance_mode?.value ? "bg-red-600" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  configs.maintenance_mode?.value ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
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
