"use client";

import { Toggle } from "@/shared/components/toggle";
import { RotateCcw } from "lucide-react";

interface ThemeDarkModeEditorProps {
  darkMode: {
    enabled: boolean;
    default: boolean;
    toggle: boolean;
  };
  onChange: (darkMode: ThemeDarkModeEditorProps["darkMode"]) => void;
  parentDarkMode?: ThemeDarkModeEditorProps["darkMode"];
}

export function ThemeDarkModeEditor({ darkMode, onChange, parentDarkMode }: ThemeDarkModeEditorProps) {
  const isOverridden = parentDarkMode && (
    darkMode.enabled !== parentDarkMode.enabled ||
    darkMode.default !== parentDarkMode.default ||
    darkMode.toggle !== parentDarkMode.toggle
  );

  const handleReset = () => {
    if (!parentDarkMode) return;
    onChange(parentDarkMode);
  };

  return (
    <div className="space-y-4">
      {parentDarkMode && (
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
        label="Enable Dark Mode"
        description="Allow customers to switch between light and dark modes"
        enabled={darkMode.enabled}
        onToggle={() => onChange({ ...darkMode, enabled: !darkMode.enabled })}
      />

      {darkMode.enabled && (
        <>
          <Toggle
            label="Default to Dark Mode"
            description="New visitors will see the dark version by default"
            enabled={darkMode.default}
            onToggle={() => onChange({ ...darkMode, default: !darkMode.default })}
          />
          <Toggle
            label="Show Toggle in Header"
            description="Display a dark/light mode switcher in the store header"
            enabled={darkMode.toggle}
            onToggle={() => onChange({ ...darkMode, toggle: !darkMode.toggle })}
          />

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
            <div className="flex gap-4">
              <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-900">Light Mode</p>
                <p className="text-xs text-gray-500">Default appearance</p>
              </div>
              <div className="flex-1 rounded-lg border border-gray-700 bg-gray-900 p-4">
                <p className="text-sm font-medium text-white">Dark Mode</p>
                <p className="text-xs text-gray-400">When toggled</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
