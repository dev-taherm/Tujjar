"use client";

interface ThemeBorderRadiusEditorProps {
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    full: number;
  };
  onChange: (borderRadius: ThemeBorderRadiusEditorProps["borderRadius"]) => void;
}

export function ThemeBorderRadiusEditor({ borderRadius, onChange }: ThemeBorderRadiusEditorProps) {
  const FIELDS = [
    { key: "small" as const, label: "Small", description: "Buttons, inputs" },
    { key: "medium" as const, label: "Medium", description: "Cards, panels" },
    { key: "large" as const, label: "Large", description: "Modals, hero sections" },
    { key: "full" as const, label: "Full", description: "Avatars, pills" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {FIELDS.map(({ key, label, description }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <p className="mb-2 text-xs text-gray-400">{description}</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="32"
                value={borderRadius[key]}
                onChange={(e) => onChange({ ...borderRadius, [key]: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="w-10 text-right text-xs text-gray-500">{borderRadius[key]}px</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
        <div className="flex gap-4">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="text-center">
              <div
                className="mx-auto mb-2 h-12 w-12 bg-primary-500"
                style={{ borderRadius: `${borderRadius[key]}px` }}
              />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
