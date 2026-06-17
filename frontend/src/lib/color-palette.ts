/**
 * Generate a full color palette (50-900) from a single hex color.
 * Uses HSL interpolation for perceptually consistent shade generation.
 */

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Target lightness for each shade (Tailwind-compatible scale)
const SHADE_TARGETS: Record<number, number> = {
  50: 97,
  100: 93,
  200: 86,
  300: 76,
  400: 64,
  500: 50,
  600: 40,
  700: 32,
  800: 25,
  900: 18,
};

export function generateColorPalette(hex: string): Record<number, string> {
  const { h, s } = hexToHSL(hex);
  const result: Record<number, string> = {};

  for (const [shade, targetL] of Object.entries(SHADE_TARGETS)) {
    const numShade = Number(shade);
    // Clamp saturation slightly at extremes
    const adjustedS = numShade <= 50 ? Math.min(s, 30) : numShade >= 900 ? Math.min(s, 90) : s;
    result[numShade] = hslToHex(h, adjustedS, targetL);
  }

  return result;
}

export function generateColorShades(baseHex: string, prefix: string): Record<string, string> {
  const palette = generateColorPalette(baseHex);
  const result: Record<string, string> = {};
  for (const [shade, hex] of Object.entries(palette)) {
    result[`--color-${prefix}-${shade}`] = hex;
  }
  return result;
}
