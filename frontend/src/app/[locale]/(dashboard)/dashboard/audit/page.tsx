"use client";

import { useState } from "react";
import { useAuditLogs } from "@/api/audit";
import { useTranslations } from "next-intl";
import { Button, Card, CardContent, Input, Select, Badge } from "@/shared/ui";
import { ChevronDown, ChevronUp, ScrollText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const actionColors: Record<string, string> = {
  "create": "bg-success-soft text-success",
  "update": "bg-primary-100 text-primary-700",
  "delete": "bg-error-soft text-error",
  "login": "bg-purple-100 text-purple-700",
  "invite": "bg-warning-soft text-warning",
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.includes(key)) return color;
  }
  return "bg-rail text-ink";
}

export default function AuditPage() {
  const t = useTranslations("dashboard.audit");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useAuditLogs({
    action: actionFilter || undefined,
    resource_type: resourceFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
  });

  const logs = data?.results || [];
  const pagination = data?.pagination;

  const resourceOptions = [
    { value: "", label: t("allResources") },
    { value: "product", label: "Product" },
    { value: "order", label: "Order" },
    { value: "store", label: "Store" },
    { value: "customer", label: "Customer" },
    { value: "page", label: "Page" },
    { value: "organization", label: "Organization" },
    { value: "role", label: "Role" },
    { value: "theme", label: "Theme" },
    { value: "media", label: "Media" },
    { value: "category", label: "Category" },
    { value: "collection", label: "Collection" },
    { value: "template", label: "Template" },
    { value: "store_domain", label: "Store Domain" },
    { value: "user", label: "User" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-ink-soft" />
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          placeholder={t("filterAction")}
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Select
          options={resourceOptions}
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Input
          type="date"
          label={t("dateFrom")}
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Input
          type="date"
          label={t("dateTo")}
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-ink-soft" /></div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-soft">{t("noLogs")}</div>
          ) : (
            <div className="divide-y divide-line">
              {logs.map((log) => (
                <div key={log.id} className="px-6 py-3">
                  <div
                    className="flex cursor-pointer items-center justify-between"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                      <span className="text-sm text-ink-soft">{log.resource_type}</span>
                      <span className="text-xs text-ink-soft font-mono">{log.resource_id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-soft">{log.user_email || "—"}</span>
                      <span className="text-xs text-ink-soft">{formatDateTime(log.created_at)}</span>
                      {expanded === log.id ? <ChevronUp className="h-4 w-4 text-ink-soft" /> : <ChevronDown className="h-4 w-4 text-ink-soft" />}
                    </div>
                  </div>
                  {expanded === log.id && (
                    <div className="mt-3 rounded-lg bg-rail p-4 text-xs space-y-2">
                      {log.old_value && (
                        <div>
                          <span className="font-medium text-ink">{t("previous")}: </span>
                          <pre className="mt-1 overflow-x-auto text-ink-soft">{JSON.stringify(log.old_value, null, 2)}</pre>
                        </div>
                      )}
                      {log.new_value && (
                        <div>
                          <span className="font-medium text-ink">{t("new")}: </span>
                          <pre className="mt-1 overflow-x-auto text-ink-soft">{JSON.stringify(log.new_value, null, 2)}</pre>
                        </div>
                      )}
                      {log.ip_address && <div><span className="font-medium text-ink">IP: </span>{log.ip_address}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-soft">
            {t("showing")} {((pagination.page - 1) * 20) + 1}–{Math.min(pagination.page * 20, pagination.total)} {t("of")} {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_previous}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-ink-soft">
              {t("page")} {pagination.page} {t("of")} {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_next}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
