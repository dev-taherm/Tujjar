"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <div className={`relative ${className ?? "flex-1 max-w-sm"}`}>
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-panel py-2 ps-10 pe-4 text-sm text-ink transition-colors placeholder:text-ink-soft/70 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  );
}
