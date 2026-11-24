"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import {
  Button,
  Card,
  Badge,
  Input,
  Label,
  Dialog,
  EmptyState,
} from "@/shared/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Webhook, Plus, Trash2, RefreshCw, Send, Copy } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  endpoint: string;
  endpoint_url: string;
  event_type: string;
  status: string;
  response_status: number | null;
  attempts: number;
  error: string;
  created_at: string;
}

const EVENT_TYPES = [
  "order.created",
  "order.paid",
  "order.status_changed",
  "order.refunded",
  "product.created",
  "product.updated",
  "review.created",
];

export function WebhooksDashboard() {
  const t = useTranslations("dashboard.webhooks");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();

  const { data: endpoints, isLoading } = useQuery({
    queryKey: ["webhook-endpoints"],
    queryFn: async (): Promise<WebhookEndpoint[]> => {
      const { data } = await apiClient.get("/webhooks/endpoints/");
      return data.results || data;
    },
  });

  const { data: deliveries } = useQuery({
    queryKey: ["webhook-deliveries"],
    queryFn: async (): Promise<WebhookDelivery[]> => {
      const { data } = await apiClient.get("/webhooks/deliveries/");
      return (data.results || data).slice(0, 15);
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["order.created"]);
  const [creating, setCreating] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["webhook-endpoints"] });
    queryClient.invalidateQueries({ queryKey: ["webhook-deliveries"] });
  };

  const createEndpoint = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/webhooks/endpoints/", {
        url,
        events: selectedEvents.length ? selectedEvents : ["*"],
        is_active: true,
      });
      return data;
    },
    onSuccess: () => {
      toast.success(tc("saved"));
      setDialogOpen(false);
      setUrl("");
      setSelectedEvents(["order.created"]);
      invalidate();
    },
    onError: () => toast.error(tc("error")),
  });

  const removeEndpoint = async (id: string) => {
    try {
      await apiClient.delete(`/webhooks/endpoints/${id}/`);
      toast.success(tc("deleted"));
      invalidate();
    } catch {
      toast.error(tc("error"));
    }
  };

  const rotateSecret = async (id: string) => {
    try {
      await apiClient.post(`/webhooks/endpoints/${id}/rotate-secret/`);
      toast.success(t("secretRotated"));
      invalidate();
    } catch {
      toast.error(tc("error"));
    }
  };

  const testFire = async (id: string) => {
    try {
      const { data } = await apiClient.post(`/webhooks/endpoints/${id}/test/`);
      toast.success(t("testQueued", { count: data.queued }));
      invalidate();
    } catch {
      toast.error(tc("error"));
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success(t("secretCopied"));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{t("description")}</p>
        <Button
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="me-2 h-4 w-4" /> {t("addEndpoint")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : !endpoints?.length ? (
        <EmptyState
          icon={Webhook}
          title={t("noEndpoints")}
          description={t("noEndpointsHint")}
        />
      ) : (
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id}>
              <div className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <p className="break-all font-mono text-sm font-medium text-gray-900">
                    {endpoint.url}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {endpoint.events.map((e) => (
                      <span
                        key={e}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <code className="break-all">{endpoint.secret}</code>
                    <button
                      onClick={() => copySecret(endpoint.secret)}
                      className="rounded p-0.5 hover:bg-gray-100"
                      aria-label={t("copySecret")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={endpoint.is_active ? "success" : "default"}>
                    {endpoint.is_active ? t("active") : t("inactive")}
                  </Badge>
                  <div className="flex gap-1">
                    <button
                      onClick={() => testFire(endpoint.id)}
                      title={t("testEvent")}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => rotateSecret(endpoint.id)}
                      title={t("rotateSecret")}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeEndpoint(endpoint.id)}
                      title={tc("delete")}
                      className="rounded p-1 text-red-400 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!!deliveries?.length && (
        <Card>
          <div className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">{t("recentDeliveries")}</h3>
            <div className="space-y-2">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs"
                >
                  <span className="font-mono">{d.event_type}</span>
                  <span className="max-w-40 truncate text-gray-500">{d.endpoint_url}</span>
                  <Badge
                    variant={
                      d.status === "succeeded" ? "success" : d.status === "failed" ? "danger" : "warning"
                    }
                  >
                    {d.status}
                  </Badge>
                  <span className="text-gray-400">{formatDateTime(d.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={t("addEndpoint")}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="wh-url">{t("payloadUrl")}</Label>
            <Input
              id="wh-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-server.com/hooks/tujjar"
            />
          </div>
          <div>
            <Label>{t("events")}</Label>
            <div className="mt-1 space-y-1">
              {EVENT_TYPES.map((e) => (
                <label key={e} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(e)}
                    onChange={(ev) =>
                      setSelectedEvents(
                        ev.target.checked
                          ? [...selectedEvents, e]
                          : selectedEvents.filter((x) => x !== e)
                      )
                    }
                  />
                  <code className="text-xs">{e}</code>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              onClick={() => createEndpoint.mutate()}
              isLoading={createEndpoint.isPending}
              disabled={!url.trim()}
            >
              {tc("create")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
