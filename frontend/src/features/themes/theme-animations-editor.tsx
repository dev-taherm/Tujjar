"use client";

import { Toggle } from "@/shared/components/toggle";
import { RotateCcw } from "lucide-react";

interface ThemeAnimationsEditorProps {
  animations: {
    enabled: boolean;
    duration: string;
    easing: string;
  };
  onChange: (animations: ThemeAnimationsEditorProps["animations"]) => void;
  parentAnimations?: ThemeAnimationsEditorProps["animations"];
}

const DURATION_OPTIONS = [
  { value: "0.1s", label: "Fast (0.1s)" },
  { value: "0.2s", label: "Quick (0.2s)" },
  { value: "0.3s", label: "Normal (0.3s)" },
  { value: "0.5s", label: "Slow (0.5s)" },
];

const EASING_OPTIONS = [
  { value: "ease", label: "Ease" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In Out" },
];

export function ThemeAnimationsEditor({ animations, onChange, parentAnimations }: ThemeAnimationsEditorProps) {
  const isOverridden = parentAnimations && (
    animations.enabled !== parentAnimations.enabled ||
    animations.duration !== parentAnimations.duration ||
    animations.easing !== parentAnimations.easing
  );

  const handleReset = () => {
    if (!parentAnimations) return;
    onChange(parentAnimations);
  };

  return (
    <div className="space-y-4">
      {parentAnimations && (
        <div className="flex items-center gap-2">
          <span className={`text-xs ${isOverridden ? "text-amber-600" : "text-gray-400"}`}>
            {isOverridden ? "Overridden" : "Inherited"}
          </span>
          {isOverridden && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset to parent"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <Toggle
        label="Enable Animations"
        enabled={animations.enabled}
        onToggle={() => onChange({ ...animations, enabled: !animations.enabled })}
      />

      {animations.enabled && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Duration</label>
            <select
              value={animations.duration}
              onChange={(e) => onChange({ ...animations, duration: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Easing</label>
            <select
              value={animations.easing}
              onChange={(e) => onChange({ ...animations, easing: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {EASING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
            <div className="flex gap-4">
              <div
                className="h-12 w-12 rounded-lg transition-all hover:scale-110"
                style={{
                  background: "var(--color-primary)",
                  transitionDuration: animations.duration,
                  transitionTimingFunction: animations.easing,
                }}
              />
              <div className="flex items-center text-sm text-gray-500">
                Hover over the square to see the animation
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
