import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The standard page heading: eyebrow, title, description and an actions
 * slot. Replaces the repeated `text-3xl font-bold text-gray-900` idiom.
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
