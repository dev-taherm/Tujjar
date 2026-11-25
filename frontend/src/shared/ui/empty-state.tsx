"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * The one empty-state pattern: khatam texture at low ink, the arch frame
 * holding the icon, one clear call to action. Every list screen adopts it.
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="khatam-bg relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-line py-16 text-center">
      <div className="arch flex h-24 w-20 items-center justify-center bg-primary-50">
        <Icon className="h-9 w-9 text-primary-400" />
      </div>
      <h3 className="mb-1 mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mb-6 max-w-sm px-6 text-sm text-ink-soft">{description}</p>
      {action}
    </div>
  );
}
