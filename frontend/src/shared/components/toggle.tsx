"use client"

interface ToggleProps {
  enabled: boolean
  onToggle: () => void
  label?: string
  description?: string
  disabled?: boolean
}

export function Toggle({ enabled, onToggle, label, description, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-ink">{label}</p>}
          {description && <p className="text-xs text-ink-soft">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
          enabled ? "bg-primary-600" : "border border-line bg-rail"
        } ${disabled ? "cursor-not-allowed opacity-50" : "active:scale-[0.97]"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
            enabled ? "translate-x-1 rtl:-translate-x-1" : "translate-x-6 rtl:-translate-x-6"
          }`}
        />
      </button>
    </div>
  )
}
