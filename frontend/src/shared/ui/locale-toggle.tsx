"use client";

import { Globe } from "lucide-react";

interface LocaleToggleProps {
  value: string;
  onChange: (locale: string) => void;
  className?: string;
}

const LOCALES = [
  { code: "en", label: "English", flag: "EN" },
  { code: "ar", label: "العربية", flag: "AR" },
];

export function LocaleToggle({ value, onChange, className = "" }: LocaleToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-ink-soft" />
      <span className="text-xs font-medium text-ink-soft">Editing:</span>
      <div className="flex rounded-lg border border-line bg-rail p-0.5">
        {LOCALES.map((locale) => (
          <button
            key={locale.code}
            onClick={() => onChange(locale.code)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              value === locale.code
                ? "bg-panel text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {locale.flag}
          </button>
        ))}
      </div>
      <span className="text-xs text-ink-soft">
        {LOCALES.find((l) => l.code === value)?.label}
      </span>
    </div>
  );
}
