"use client";

import { useState } from "react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/shared/ui";
import { apiClient } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Trash2, CheckCircle, XCircle, Shield, Copy, ChevronDown, ChevronUp } from "lucide-react";
import type { StoreDomain } from "@/shared/types";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface StoreDomainsProps {
  storeId: string;
}

interface DnsInstructions {
  domain: string;
  verification_token: string;
  instructions: {
    cname: { type: string; host: string; value: string; description: string };
    verification: { type: string; host: string; value: string; description: string };
  };
  verified: boolean;
}

export function StoreDomains({ storeId }: StoreDomainsProps) {
  const t = useTranslations("dashboard.domains");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState("");

  const { data: domains, isLoading } = useQuery({
    queryKey: ["stores", storeId, "domains"],
    queryFn: async (): Promise<StoreDomain[]> => {
      const { data } = await apiClient.get(`/stores/${storeId}/domains/`);
      return data.results || data;
    },
  });

  const addDomain = useMutation({
    mutationFn: async (domain: string) => {
      const { data } = await apiClient.post(`/stores/${storeId}/domains/`, { domain });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "domains"] });
      setNewDomain("");
    },
  });

  const removeDomain = useMutation({
    mutationFn: async (domainId: string) => {
      await apiClient.delete(`/stores/${storeId}/domains/${domainId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "domains"] });
    },
  });

  const setPrimary = useMutation({
    mutationFn: async (domainId: string) => {
      const { data } = await apiClient.post(`/stores/${storeId}/domains/${domainId}/primary/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "domains"] });
      toast.success(t("primarySet") || "Primary domain updated");
    },
  });

  const verifyDomain = useMutation({
    mutationFn: async (domainId: string) => {
      const { data } = await apiClient.post(`/stores/${storeId}/domains/${domainId}/verify/`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "domains"] });
      if (data.verified) {
        toast.success(t("verified") || "Domain verified successfully!");
      } else {
        toast.error(t("verifyFailed") || "DNS record not found. Check your DNS settings.");
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("customDomains")}</CardTitle>
        <CardDescription>{t("connectDomain")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="store.yourdomain.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
          />
          <Button
            onClick={() => addDomain.mutate(newDomain)}
            disabled={!newDomain}
            isLoading={addDomain.isPending}
          >
            {t("addDomain")}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : domains?.length ? (
          <div className="space-y-2">
            {domains.map((domain) => (
              <DomainItem
                key={domain.id}
                domain={domain}
                storeId={storeId}
                onVerify={() => verifyDomain.mutate(domain.id)}
                onSetPrimary={() => setPrimary.mutate(domain.id)}
                onRemove={() => removeDomain.mutate(domain.id)}
                isVerifying={verifyDomain.isPending}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t("noCustomDomains")}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DomainItem({
  domain,
  storeId,
  onVerify,
  onSetPrimary,
  onRemove,
  isVerifying,
}: {
  domain: StoreDomain;
  storeId: string;
  onVerify: () => void;
  onSetPrimary: () => void;
  onRemove: () => void;
  isVerifying: boolean;
}) {
  const t = useTranslations("dashboard.domains");
  const [showInstructions, setShowInstructions] = useState(false);

  const { data: instructions } = useQuery({
    queryKey: ["stores", storeId, "domains", domain.id, "instructions"],
    queryFn: async (): Promise<DnsInstructions> => {
      const { data } = await apiClient.get(`/stores/${storeId}/domains/${domain.id}/instructions/`);
      return data;
    },
    enabled: showInstructions && !domain.verified,
  });

  return (
    <div className="rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">{domain.domain}</span>
          {domain.verified ? (
            <Badge variant="success"><CheckCircle className="me-1 h-3 w-3" />{t("verified")}</Badge>
          ) : (
            <Badge variant="warning"><XCircle className="me-1 h-3 w-3" />{t("pending")}</Badge>
          )}
          {domain.is_primary && <Badge>{t("primary")}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {!domain.verified && (
            <Button variant="outline" size="sm" onClick={onVerify} isLoading={isVerifying}>
              <Shield className="me-1 h-3 w-3" /> {t("verify") || "Verify"}
            </Button>
          )}
          {!domain.is_primary && domain.verified && (
            <Button variant="outline" size="sm" onClick={onSetPrimary}>
              {t("setPrimary") || "Set Primary"}
            </Button>
          )}
          {!domain.verified && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {t("dnsInstructions") || "DNS"}
              {showInstructions ? <ChevronUp className="ms-1 h-3 w-3" /> : <ChevronDown className="ms-1 h-3 w-3" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {showInstructions && instructions && (
        <div className="border-t border-gray-100 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-medium text-gray-600">{t("setupInstructions") || "DNS Setup Instructions"}</p>
          <div className="space-y-2">
            <DnsRecord
              label="CNAME"
              host={instructions.instructions.cname.host}
              value={instructions.instructions.cname.value}
            />
            <DnsRecord
              label="TXT (Verification)"
              host={instructions.instructions.verification.host}
              value={instructions.instructions.verification.value}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DnsRecord({ label, host, value }: { label: string; host: string; value: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded border border-gray-200 bg-white p-2">
      <p className="mb-1 text-[10px] font-medium text-gray-400 uppercase">{label}</p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500">Host:</span>
        <code className="flex-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-700">{host}</code>
        <button onClick={() => copyToClipboard(host, "host")} className="text-gray-400 hover:text-gray-600">
          {copied === "host" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500">Value:</span>
        <code className="flex-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-700 truncate">{value}</code>
        <button onClick={() => copyToClipboard(value, "value")} className="text-gray-400 hover:text-gray-600">
          {copied === "value" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
