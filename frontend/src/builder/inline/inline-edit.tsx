"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface InlineEditProps {
  value: string;
  onChange: (value: string) => void;
  tag?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  placeholder?: string;
  isEditing?: boolean;
}

export function InlineEdit({ value, onChange, tag: Tag = "p", className = "", placeholder = "Click to edit...", isEditing = false }: InlineEditProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      setLocalValue(ref.current.textContent || "");
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      ref.current?.blur();
    }
  }, [value]);

  if (!isEditing) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      className={`${className} cursor-text outline-none rounded px-1 -mx-1 transition-colors ${
        isFocused ? "bg-blue-50 ring-2 ring-blue-300" : "hover:bg-gray-50 hover:ring-1 hover:ring-gray-200"
      }`}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: localValue || placeholder }}
    />
  );
}
