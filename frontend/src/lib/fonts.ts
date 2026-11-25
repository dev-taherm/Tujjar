/**
 * Google Fonts catalog used by the theme typography editor and the storefront
 * font loader. Each entry carries the weights the family actually publishes so
 * the css2 request never asks for an unavailable weight (the Google Fonts API
 * rejects the whole stylesheet in that case).
 */
export interface GoogleFont {
  value: string;
  label: string;
  /** Weights to request from the css2 API. */
  weights: number[];
  category: "sans" | "serif" | "display" | "arabic";
}

export const GOOGLE_FONTS: GoogleFont[] = [
  // ── Sans ────────────────────────────────────────────────────────────────
  { value: "Inter", label: "Inter", weights: [400, 500, 600, 700], category: "sans" },
  { value: "system-ui", label: "System UI", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Roboto", label: "Roboto", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Open Sans", label: "Open Sans", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Lato", label: "Lato", weights: [400, 700], category: "sans" },
  { value: "Montserrat", label: "Montserrat", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Poppins", label: "Poppins", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Source Sans 3", label: "Source Sans 3", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Nunito", label: "Nunito", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Raleway", label: "Raleway", weights: [400, 500, 600, 700], category: "sans" },
  { value: "DM Sans", label: "DM Sans", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Rubik", label: "Rubik", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Work Sans", label: "Work Sans", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Quicksand", label: "Quicksand", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Manrope", label: "Manrope", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Barlow", label: "Barlow", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Fira Sans", label: "Fira Sans", weights: [400, 500, 600, 700], category: "sans" },
  { value: "Karla", label: "Karla", weights: [400, 500, 600, 700], category: "sans" },
  { value: "IBM Plex Sans", label: "IBM Plex Sans", weights: [400, 500, 600, 700], category: "sans" },
  // ── Serif / display ─────────────────────────────────────────────────────
  { value: "Playfair Display", label: "Playfair Display", weights: [400, 500, 600, 700], category: "serif" },
  { value: "Merriweather", label: "Merriweather", weights: [400, 700], category: "serif" },
  { value: "Libre Baskerville", label: "Libre Baskerville", weights: [400, 700], category: "serif" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond", weights: [400, 500, 600, 700], category: "serif" },
  { value: "Oswald", label: "Oswald", weights: [400, 500, 600, 700], category: "display" },
  { value: "Space Grotesk", label: "Space Grotesk", weights: [400, 500, 600, 700], category: "display" },
  // ── Arabic ──────────────────────────────────────────────────────────────
  { value: "Cairo", label: "Cairo", weights: [400, 500, 600, 700], category: "arabic" },
  { value: "Tajawal", label: "Tajawal", weights: [400, 500, 700], category: "arabic" },
  { value: "Almarai", label: "Almarai", weights: [400, 700], category: "arabic" },
  { value: "Amiri", label: "Amiri", weights: [400, 700], category: "arabic" },
  { value: "Noto Kufi Arabic", label: "Noto Kufi Arabic", weights: [400, 500, 600, 700], category: "arabic" },
  { value: "IBM Plex Sans Arabic", label: "IBM Plex Sans Arabic", weights: [400, 500, 600, 700], category: "arabic" },
];

/** Options list for plain <select> dropdowns. */
export const FONT_OPTIONS = GOOGLE_FONTS.map((font) => ({
  value: font.value,
  label: font.label,
}));

/**
 * Build one Google Fonts css2 href per requested family, using the family's
 * available weights. Families not in the catalog (custom theme names) fall
 * back to a safe 400;700 request.
 */
export function resolveGoogleFontsHrefs(
  fonts: (string | undefined | null)[]
): string[] {
  const families: string[] = [];
  for (const font of fonts) {
    if (!font || font.startsWith("system")) continue;
    if (!families.includes(font)) families.push(font);
  }
  return families.map((family) => {
    const meta = GOOGLE_FONTS.find((f) => f.value === family);
    const weights = (meta?.weights ?? [400, 700]).join(";");
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights}&display=swap`;
  });
}
