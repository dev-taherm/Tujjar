"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, Building2, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { apiClient } from "@/api/client";

interface Membership {
  id: string;
  name: string;
  slug: string;
  role: string;
  is_current: boolean;
}

/**
 * Organization switcher: lists the user's memberships, calls
 * POST /auth/switch-org/ to obtain a re-scoped token pair, and reloads the
 * dashboard with the new tenant context.
 */
export function OrgSwitcher() {
  const t = useTranslations("dashboard.orgSwitcher");
  const queryClient = useQueryClient();
  const { tokens, setTokens, organization } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { data: memberships } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: async (): Promise<Membership[]> => {
      const { data } = await apiClient.get("/auth/switch-org/");
      return data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const switchTo = async (orgId: string) => {
    if (orgId === organization?.id) {
      setOpen(false);
      return;
    }
    setSwitching(orgId);
    try {
      const { data } = await apiClient.post("/auth/switch-org/", { org_id: orgId });
      setTokens(data.tokens);
      useAuthStore.getState().setOrganization(data.organization);
      queryClient.clear();
      toast.success(t("switched", { name: data.organization.name }));
      setOpen(false);
      // Full reload so every query re-fetches under the new tenant context
      setTimeout(() => window.location.reload(), 400);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t("switchFailed");
      toast.error(detail);
    } finally {
      setSwitching(null);
    }
  };

  const current =
    memberships?.find((m) => m.id === organization?.id) ??
    memberships?.find((m) => m.is_current) ??
    null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-gray-100"
        disabled={!!switching}
      >
        <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="truncate font-medium text-gray-800">
          {current?.name || organization?.name || t("selectOrg")}
        </span>
        <ChevronsUpDown className="ms-auto h-3.5 w-3.5 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {(memberships || []).map((m) => (
            <button
              key={m.id}
              onClick={() => switchTo(m.id)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="truncate">{m.name}</span>
              {m.is_current && <Check className="h-4 w-4 text-green-600" />}
            </button>
          ))}
          {switching && (
            <div className="px-3 py-2 text-xs text-gray-400">{t("switching")}</div>
          )}
        </div>
      )}
    </div>
  );
}
