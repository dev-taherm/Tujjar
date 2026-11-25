"use client";

import { RotateCcw } from "lucide-react";

interface ThemeBorderRadiusEditorProps {
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    full: number;
  };
  onChange: (borderRadius: ThemeBorderRadiusEditorProps["borderRadius"]) => void;
  parentBorderRadius?: ThemeBorderRadiusEditorProps["borderRadius"];
}

export function ThemeBorderRadiusEditor({ borderRadius, onChange, parentBorderRadius }: ThemeBorderRadiusEditorProps) {
  const FIELDS = [
    { key: "small" as const, label: "Small", description: "Buttons, inputs" },
    { key: "medium" as const, label: "Medium", description: "Cards, panels" },
    { key: "large" as const, label: "Large", description: "Modals, hero sections" },
    { key: "full" as const, label: "Full", description: "Avatars, pills" },
  ];

  const handleReset = (key: keyof typeof borderRadius) => {
    if (!parentBorderRadius) return;
    onChange({ ...borderRadius, [key]: parentBorderRadius[key] });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {FIELDS.map(({ key, label, description }) => {
          const isOverridden = parentBorderRadius && borderRadius[key] !== parentBorderRadius[key];
          return (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
              <p className="mb-2 text-xs text-ink-soft">{description}</p>
              {parentBorderRadius && (
                <span className={`mb-1 block text-[10px] ${isOverridden ? "text-warning" : "text-ink-soft"}`}>
                  {isOverridden ? "Overridden" : "Inherited"}
                </span>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={borderRadius[key]}
                  onChange={(e) => onChange({ ...borderRadius, [key]: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-10 text-end text-xs text-ink-soft">{borderRadius[key]}px</span>
                {isOverridden && parentBorderRadius && (
                  <button
                    type="button"
                    onClick={() => handleReset(key)}
                    title="Reset to parent"
                    className="rounded p-1 text-ink-soft hover:bg-rail hover:text-ink-soft"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-line bg-rail p-4">
        <p className="mb-3 text-xs font-medium text-ink-soft uppercase tracking-wide">Preview</p>
        <div className="flex gap-4">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="text-center">
              <div
                className="mx-auto mb-2 h-12 w-12"
                style={{ borderRadius: `${borderRadius[key]}px`, background: "var(--color-primary)" }}
              />
              <span className="text-xs text-ink-soft">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
