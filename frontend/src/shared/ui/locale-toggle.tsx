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
      <Globe className="h-4 w-4 text-gray-400" />
      <span className="text-xs font-medium text-gray-500">Editing:</span>
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
        {LOCALES.map((locale) => (
          <button
            key={locale.code}
            onClick={() => onChange(locale.code)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              value === locale.code
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {locale.flag}
          </button>
        ))}
      </div>
      <span className="text-xs text-gray-400">
        {LOCALES.find((l) => l.code === value)?.label}
      </span>
    </div>
  );
}
