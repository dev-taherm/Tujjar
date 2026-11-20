import type { ThemeConfig, ThemeOverride } from "@/shared/types";
import { generateColorShades } from "@/lib/color-palette";

const COLOR_VAR_MAP: Record<string, string> = {
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

const DARK_DEFAULTS: Record<string, string> = {
  background: "#111827",
  surface: "#1f2937",
  text: "#f3f4f6",
  textSecondary: "#9ca3af",
  border: "#374151",
};

type ThemeLike = ThemeConfig | ThemeOverride;

/**
 * Pure helper: resolve a theme into a flat map of CSS variable -> value.
 * `dark` swaps background/surface/text/border for dark defaults and prefers
 * the theme's *Dark color variants when available.
 */
export function collectThemeVars(
  theme: ThemeLike | null | undefined,
  dark = false
): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!theme) return vars;

  if (theme.colors) {
    const colors = theme.colors as Record<string, string>;
    const darkOverrides: Record<string, string> = dark
      ? {
          ...DARK_DEFAULTS,
          primary: colors.primaryDark || colors.primary || "",
          secondary: colors.secondaryDark || colors.secondary || "",
          accent: colors.accentDark || colors.accent || "",
        }
      : {};

    const resolvedColors = { ...colors, ...darkOverrides };

    for (const [key, cssVar] of Object.entries(COLOR_VAR_MAP)) {
      if (resolvedColors[key]) {
        vars[cssVar] = resolvedColors[key];
      }
    }

    const shadeKeys = ["primary", "secondary", "accent"] as const;
    for (const colorKey of shadeKeys) {
      const hex = resolvedColors[colorKey];
      if (hex) {
        const shades = generateColorShades(hex, colorKey);
        for (const [varName, value] of Object.entries(shades)) {
          vars[varName] = value;
        }
      }
    }
  }

  if (theme.borderRadius) {
    const br = theme.borderRadius;
    vars["--radius-sm"] = `${br.small ?? 4}px`;
    vars["--radius-md"] = `${br.medium ?? 8}px`;
    vars["--radius-lg"] = `${br.large ?? 12}px`;
    vars["--radius-full"] = `${br.full ?? 9999}px`;
  }

  if (theme.typography) {
    const typo = theme.typography;
    if (typo.headingFont) vars["--font-heading"] = typo.headingFont;
    if (typo.bodyFont) vars["--font-body"] = typo.bodyFont;
    if (typo.baseFontSize) vars["--font-size-base"] = `${typo.baseFontSize}px`;
    if (typo.scale) vars["--font-scale"] = `${typo.scale}`;
    if (typo.lineHeight) vars["--line-height-base"] = `${typo.lineHeight}`;
  }

  if (theme.spacing) {
    const sp = theme.spacing;
    if (sp.sectionPaddingY) vars["--section-padding-y"] = `${sp.sectionPaddingY}px`;
    if (sp.sectionPaddingX) vars["--section-padding-x"] = `${sp.sectionPaddingX}px`;
    if (sp.containerMaxWidth) vars["--container-max-width"] = `${sp.containerMaxWidth}px`;
    if (sp.gridGap) vars["--grid-gap"] = `${sp.gridGap}px`;
  }

  if ("animations" in theme && theme.animations) {
    const anim = theme.animations;
    const durationMap: Record<string, string> = { fast: "0.15s", normal: "0.3s", slow: "0.5s" };
    const raw = anim.duration || "0.3s";
    const duration = anim.enabled !== false ? (durationMap[raw] || raw) : "0s";
    vars["--transition-duration"] = duration;
    vars["--transition-easing"] = anim.easing || "ease";
  }

  return vars;
}

function declarationsToCss(decls: Record<string, string>): string {
  return Object.entries(decls)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
}

/**
 * Pure helper: emit the theme as a CSS string. Renders light variables on
 * `:root` and dark overrides under `.dark`, so a single server-rendered
 * <style> tag covers both modes without any client-side DOM mutation.
 * Returns an empty string when the theme carries no configuration.
 */
export function buildThemeCss(theme: ThemeLike | null | undefined): string {
  if (!theme) return "";
  const light = collectThemeVars(theme, false);
  if (Object.keys(light).length === 0) return "";

  const dark = collectThemeVars(theme, true);
  const darkOnly = Object.fromEntries(
    Object.entries(dark).filter(([name, value]) => light[name] !== value)
  );

  const css = [`:root {\n${declarationsToCss(light)}\n}`];
  if (Object.keys(darkOnly).length > 0) {
    css.push(`.dark {\n${declarationsToCss(darkOnly)}\n}`);
  }
  return css.join("\n\n");
}

/**
 * Apply theme CSS variables to a DOM element (or document.documentElement by default).
 * Supports full ThemeConfig or partial ThemeOverride.
 */
export function applyThemeVariables(
  theme: ThemeLike | null | undefined,
  target?: HTMLElement,
  dark = false
) {
  const vars = collectThemeVars(theme, dark);
  const root = target || document.documentElement;
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
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
