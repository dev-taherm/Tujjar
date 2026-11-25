"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { useLocale } from "next-intl";

interface AnnouncementBarConfig {
  enabled: boolean;
  text: string | Record<string, string>;
  link_url?: string;
  link_label?: string | Record<string, string>;
  background_color?: string;
  text_color?: string;
  dismissible?: boolean;
}

interface AnnouncementBarProps {
  config?: AnnouncementBarConfig;
  storeSlug: string;
}

/** Resolve a plain string or per-locale map to a display string. */
function resolveLocalizedString(
  value?: string | Record<string, string>,
  locale?: string
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (locale && value[locale]) || value.en || "";
}

export function AnnouncementBar({ config, storeSlug }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);
  const locale = useLocale();

  const storageKey = `tujjar-announcement-${storeSlug}`;

  const message = resolveLocalizedString(config?.text, locale);

  const isHidden = useMemo(() => {
    if (typeof window === "undefined") return true;
    if (!config?.enabled) return true;
    if (!message) return true;
    const stored = localStorage.getItem(storageKey);
    return stored === message;
  }, [config, storageKey, message]);

  if (isHidden || dismissed || !config) return null;

  const bg = config.background_color || "var(--color-primary)";
  const color = config.text_color || "#ffffff";
  const linkLabel = resolveLocalizedString(config.link_label, locale);

  const handleDismiss = () => {
    setDismissed(true);
    if (message) {
      localStorage.setItem(storageKey, message);
    }
  };

  const content = (
    <span style={{ color }}>
      {message}
      {config.link_url && linkLabel && (
        <span className="ms-2 underline">{linkLabel}</span>
      )}
    </span>
  );

  return (
    <div
      className="relative flex items-center justify-center px-4 py-2 text-center text-sm font-medium"
      style={{ background: bg }}
    >
      {config.link_url ? (
        <a href={config.link_url} className="hover:opacity-80">
          {content}
        </a>
      ) : (
        content
      )}
      {config.dismissible !== false && (
        <button
          onClick={handleDismiss}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-60 hover:opacity-100"
          style={{ color }}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
