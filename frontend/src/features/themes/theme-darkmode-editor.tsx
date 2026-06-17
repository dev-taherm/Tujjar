"use client";

import { Toggle } from "@/shared/components/toggle";

interface ThemeDarkModeEditorProps {
  darkMode: {
    enabled: boolean;
    default: boolean;
    toggle: boolean;
  };
  onChange: (darkMode: ThemeDarkModeEditorProps["darkMode"]) => void;
}

export function ThemeDarkModeEditor({ darkMode, onChange }: ThemeDarkModeEditorProps) {
  return (
    <div className="space-y-4">
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
