import type { ThemeConfig, ThemeOverride } from "@/shared/types";
import { generateColorShades } from "@/lib/color-palette";

/**
 * Apply theme CSS variables to a DOM element (or document.documentElement by default).
 * Supports full ThemeConfig or partial ThemeOverride.
 */
export function applyThemeVariables(
  theme: ThemeConfig | ThemeOverride | null | undefined,
  target?: HTMLElement,
  dark = false
) {
  if (!theme) return;
  const root = target || document.documentElement;

  if (theme.colors) {
    const darkDefaults: Record<string, string> = dark
      ? {
          background: "#111827",
          surface: "#1f2937",
          text: "#f3f4f6",
          textSecondary: "#9ca3af",
          border: "#374151",
          primary: (theme.colors as Record<string, string>).primaryDark || theme.colors.primary || "",
          secondary: (theme.colors as Record<string, string>).secondaryDark || theme.colors.secondary || "",
          accent: (theme.colors as Record<string, string>).accentDark || theme.colors.accent || "",
        }
      : {};

    const resolvedColors = { ...theme.colors, ...darkDefaults };

    const colorMap: Record<string, string> = {
      primary: "--color-primary",
      secondary: "--color-secondary",
      accent: "--color-accent",
      background: "--color-bg",
      surface: "--color-surface",
      text: "--color-text",
      textSecondary: "--color-text-secondary",
      border: "--color-border",
      error: "--color-error",
      success: "--color-success",
      warning: "--color-warning",
    };

    for (const [key, cssVar] of Object.entries(colorMap)) {
      if (resolvedColors[key as keyof typeof resolvedColors]) {
        root.style.setProperty(cssVar, resolvedColors[key as keyof typeof resolvedColors] ?? null);
      }
    }

    const shadeKeys = ["primary", "secondary", "accent"] as const;
    for (const colorKey of shadeKeys) {
      const hex = resolvedColors[colorKey];
      if (hex) {
        const shades = generateColorShades(hex, colorKey);
        for (const [varName, value] of Object.entries(shades)) {
          root.style.setProperty(varName, value);
        }
      }
    }
  }

  if (theme.borderRadius) {
    const br = theme.borderRadius;
    root.style.setProperty("--radius-sm", `${br.small ?? 4}px`);
    root.style.setProperty("--radius-md", `${br.medium ?? 8}px`);
    root.style.setProperty("--radius-lg", `${br.large ?? 12}px`);
    root.style.setProperty("--radius-full", `${br.full ?? 9999}px`);
  }

  if (theme.typography) {
    const typo = theme.typography;
    if (typo.headingFont) root.style.setProperty("--font-heading", typo.headingFont);
    if (typo.bodyFont) root.style.setProperty("--font-body", typo.bodyFont);
    if (typo.baseFontSize) root.style.setProperty("--font-size-base", `${typo.baseFontSize}px`);
    if (typo.scale) root.style.setProperty("--font-scale", `${typo.scale}`);
    if (typo.lineHeight) root.style.setProperty("--line-height-base", `${typo.lineHeight}`);
  }

  if (theme.spacing) {
    const sp = theme.spacing;
    if (sp.sectionPaddingY) root.style.setProperty("--section-padding-y", `${sp.sectionPaddingY}px`);
    if (sp.sectionPaddingX) root.style.setProperty("--section-padding-x", `${sp.sectionPaddingX}px`);
    if (sp.containerMaxWidth) root.style.setProperty("--container-max-width", `${sp.containerMaxWidth}px`);
    if (sp.gridGap) root.style.setProperty("--grid-gap", `${sp.gridGap}px`);
  }

  if ("animations" in theme && theme.animations) {
    const anim = theme.animations;
    const durationMap: Record<string, string> = { fast: "0.15s", normal: "0.3s", slow: "0.5s" };
    const raw = anim.duration || "0.3s";
    const duration = anim.enabled !== false ? (durationMap[raw] || raw) : "0s";
    root.style.setProperty("--transition-duration", duration);
    root.style.setProperty("--transition-easing", anim.easing || "ease");
  }
}

/**
 * Merge a page-level ThemeOverride on top of a base ThemeConfig.
 */
export function mergeThemeOverride(base: ThemeConfig | null | undefined, override: ThemeOverride | null | undefined): ThemeConfig {
  if (!base && !override) return {} as ThemeConfig;
  if (!override) return base || ({} as ThemeConfig);
  if (!base) return override as ThemeConfig;

  return {
    ...base,
    colors: { ...base.colors, ...override.colors },
    typography: { ...base.typography, ...override.typography },
    spacing: { ...base.spacing, ...override.spacing },
    borderRadius: { ...base.borderRadius, ...override.borderRadius },
  };
}
