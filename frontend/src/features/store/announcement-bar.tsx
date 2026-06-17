"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";

interface AnnouncementBarConfig {
  enabled: boolean;
  text: string;
  link_url?: string;
  link_label?: string;
  background_color?: string;
  text_color?: string;
  dismissible?: boolean;
}

interface AnnouncementBarProps {
  config?: AnnouncementBarConfig;
  storeSlug: string;
}

export function AnnouncementBar({ config, storeSlug }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);

  const storageKey = `tujjar-announcement-${storeSlug}`;

  const isHidden = useMemo(() => {
    if (typeof window === "undefined") return true;
    if (!config?.enabled || !config?.text) return true;
    const stored = localStorage.getItem(storageKey);
    return stored === config.text;
  }, [config, storageKey]);

  if (isHidden || dismissed || !config) return null;

  const bg = config.background_color || "var(--color-primary)";
  const color = config.text_color || "#ffffff";

  const handleDismiss = () => {
    setDismissed(true);
    if (config?.text) {
      localStorage.setItem(storageKey, config.text);
    }
  };

  const content = (
    <span style={{ color }}>
      {config.text}
      {config.link_url && config.link_label && (
        <span className="ms-2 underline">{config.link_label}</span>
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
