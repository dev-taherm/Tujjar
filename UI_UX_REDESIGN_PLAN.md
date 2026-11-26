# Tujjar UI/UX Redesign Plan — "Old Sana'a"

> **Goal:** Make Tujjar unmistakably *Tujjar* — an AI-powered, bilingual-by-birth commerce platform whose screens no one confuses with the default shadcn/Tailwind SaaS look.
>
> **Direction (decided):** Old Sana'a — the design language of the old city: mudbrick sienna tower houses, gypsum-white nurah trim, and the qamariya fanlight windows whose stained glass carries the accent system. Warm where competitors are cold gray, geometric where they are generic, bilingual-native where they are translated.
> **Scope (decided):** All four surfaces — merchant dashboard, public storefront, marketing landing, page builder. Auth and admin ride along.
> **Approach (decided):** Evolve in place — keep the hand-rolled component APIs, replace the design tokens, typography, motion, and key components. No new headless UI dependency.
> **Dark mode (decided):** First-class from day one — "Qamariya Night", the old city after dark with its windows glowing.

---

## 0. Where we are today (evidence)

From the codebase audit (`frontend/src/app/globals.css`, `src/shared`, `src/builder`, `src/features/storefront`):

| Dimension | Current state | Problem |
|---|---|---|
| Color | `--color-primary-600: #2563eb` — literal Tailwind blue; gray-50 dashboard canvas, white cards, gray-200 borders | Reads as every shadcn dashboard on the internet |
| Typography | Inter (latin subset only); Arabic dashboard text falls back to system fonts | No brand voice; bilingual rendered as an afterthought |
| Motion | Zero custom keyframes; only `animate-pulse`, `animate-spin`, `active:scale-[0.98]` | No personality, no choreography |
| Tokens | Split-brained: storefront consumes `--color-*` vars, dashboard hardcodes raw `gray-*` / `blue-600` / `amber-*` classes (even inside the shared kit and builder chrome) | Rebranding today would silently miss half the UI |
| Components | Hand-rolled shadcn clones; no table/tabs/dropdown/tooltip/sheet/command components — features re-implement popovers & tabs per page | Inconsistent, hard to restyle systematically |
| Brand assets | 2.1 MB unused `logo.png`; wordmark is plain text; default Next.js starter SVGs still in `public/` | No visual identity shipped at all |
| Dark mode | `.dark` toggles exist in the storefront only; dashboard has no dark styles | Half-implemented |
| RTL | Logical utilities mostly used, but leaks: `SearchInput` icon `left-3`, product-card menus `right-0` | Arabic polish is incomplete |
| Dead/broken | `text-muted-foreground` (nonexistent token) used; `prose` classes with no `@tailwindcss/typography` installed; 3 different spinner implementations | Small debt, visible jank |

**Audits already agree:** `AUDIT_REPORT.md` scores UX 4/10; `SHOPIFY_COMPETITIVENESS_AUDIT.md` scores UX 5/10 with the same gaps (no onboarding, skeletal storefront, no Cmd+K, weak empty/loading states).

---

## 1. Vision — the three identity pillars

Tujjar (تجّار, *merchants*) has an asset no competitor has: the visual heritage of Old Sana'a — a UNESCO-listed merchant city whose tower houses still hold the souks and the *samsarah* (merchant inns) that gave markets their soul. The design language, **Old Sana'a**, turns that heritage into a system that is warm where competitors are cold gray, geometric where they are generic, and bilingual-native where they are translated.

1. **Warm, not default.** Gypsum-white canvas, mudbrick-sienna primary, qamariya-glass accents — cobalt, green, amber — over warm brown-black dark mode. In a sea of blue/gray SaaS tools, warm reads as premium and human — and instantly distinguishes Tujjar from the default look.
2. **Heritage as system, not costume.** The city's actual design language is used sparingly and structurally: the **qamariya** fanlight (semicircular stained-glass window with radial mullions) as the signature motif, **gypsum banding** (nurah trim) as dividers and section caps, the **khatam** star as a low-opacity texture, the **arch** for image frames. Motifs are 3–8% moments, never wallpaper — no stock "Arabian nights" clip-art anywhere.
3. **Bilingual-native.** Arabic and English are designed together: one font family that renders both beautifully (IBM Plex Sans Arabic), display faces for each script (Fraunces / Reem Kufi), RTL-perfect layout logic, and locale-aware brand voice. The dashboard in Arabic should feel *designed in Arabic*, not switched into Arabic.

**Uniqueness test:** a screenshot of any Tujjar page, cropped and grayscale, should still be recognizable by its typography rhythm, the fanlight mark, and warm surfaces. None of the current pages pass that test.

---

## 2. Design language spec

### 2.1 Color — "Gypsum Light" (light) & "Qamariya Night" (dark)

Light mode:

| Token | Value | Role |
|---|---|---|
| `--color-bg` / `--color-canvas` | `#F9F5EC` | App canvas (gypsum-white nurah, not gray-50) |
| `--color-surface` / `--color-panel` | `#FFFFFF` | Cards, panels |
| `--color-surface-2` / `--color-rail` | `#F0E8D8` | Subtle fills, table headers, sidebar rail (pale-straw mudbrick wash) |
| `--color-text` / `--color-ink` | `#26201A` | Warm brown-black ink |
| `--color-text-secondary` / `--color-ink-soft` | `#6F6154` | Muted warm gray |
| `--color-border` / `--color-line` | `#E3D9C6` | Gypsum borders (replaces gray-200) |
| `--color-primary-50…900` | `#F9EFE6 / #F0DCC8 / #E1BE9C / #CD9A6B / #BC7B4C / #AE6239 / #96522E / #7A3F22 / #412114` | **Mudbrick sienna** — the brand color |
| `--color-accent-*` | ramp around `#D69229` (`#DFA23E` glass) | **Qamariya amber** — AI badges, highlights, the signature gradient |
| `--color-success-*` | ramp around `#3E7050` | Qamariya glass green |
| `--color-info-*` | ramp around `#2D5F8C` | Qamariya cobalt |
| `--color-warning-*` | ramp around `#8A5A10` | Amber (kept distinct from qamariya amber-500) |
| `--color-error-*` | ramp around `#B33840` | Qamariya ruby — deliberately crimson-leaning so it never reads as sienna |

Dark mode ("Qamariya Night") — warm brown-blacks with the windows glowing, never gray-blacks:

| Token | Value |
|---|---|
| `--color-bg` / `--color-canvas` | `#1A1410` |
| `--color-surface` / `--color-panel` | `#221B14` |
| `--color-surface-2` / `--color-rail` | `#2C2318` |
| `--color-text` / `--color-ink` | `#F5EDDC` |
| `--color-text-secondary` / `--color-ink-soft` | `#AC9E8B` |
| `--color-border` / `--color-line` | `#3B3023` |
| primary (interactive scale) | sienna brightens to `#D98A5C` / hover `#E8A47B` — mudbrick lit from within |
| accent | `#E9AC4C`; success `#82B894`; error `#E4606D`; info `#7FAED4` — glass glowing |

**Signature gradient:** mudbrick sienna → qamariya amber (`#96522E → #DFA23E`) used only for: landing hero wall, onboarding finale, AI-generated-content badges, and the "premium" plan chip. Nowhere else.

Rules:
- Never reuse raw Tailwind `gray-*`/`blue-*` in the dashboard; every color goes through a token. Raw Tailwind colors are allowed only *inside* ramp definitions in `globals.css`.
- Status colors map through tokens (the hardcoded `shipped: bg-indigo-100` pill maps become a single `status-*` token set — cobalt for shipped/processing, green for delivered, amber for pending, ruby for cancelled).
- All text/background pairs must pass WCAG AA (4.5:1 body, 3:1 large/UI) in **both** modes and **both** scripts — the palette generator change in §4.1 enforces this for storefront themes.

### 2.2 Typography

| Role | Face | Notes |
|---|---|---|
| UI/body (both scripts) | **IBM Plex Sans Arabic** — weights 400/500/600/700, `subsets: ["arabic", "latin"]` via `next/font` | Already in the storefront font catalog (`src/lib/fonts.ts`), so dashboards and storefronts share a voice. Replaces Inter. |
| Display, Latin | **Fraunces** (SOFt optical, 500/600) — landing hero, onboarding headlines, big stat moments | Warm old-style serif; nothing else in commerce SaaS looks like it |
| Display, Arabic | **Reem Kufi** (geometric kufi, pairs with Fraunces' presence) — same roles in `ar` | Distinctive, modern, culturally grounded |
| Numeric data | Plex with `font-feature-settings: "tnum"` / `tabular-nums` | Stat cards, tables, invoices don't jitter |

- Heading/body distinction comes from weight + size, not a second font: 600/700 headings at a 1.2 line-height rhythm vs 400/1.65 body.
- Type scale (replace the flat 16px + 1.25 scale): `12 / 13 / 15 / 17 / 20 / 24 / 30 / 38` with display jumps to 48/60 on landing/onboarding only.
- Arabic gets `line-height` bump (+0.1em) and no uppercase (Arabic has no case; today's `uppercase tracking-wider` group headers look sparse in Arabic) — locale-conditional via a `lang-ar` utility class.

### 2.3 Shape, motif, texture

- **Brand mark:** an arched Sana'a window with its qamariya fanlight — arch outline, horizontal chord, radial mullions (`src/shared/brand/logo.tsx`). Scales from favicon (32px) to auth panels.
- **Radii:** inputs/controls 10px (`--radius-md`), cards/panels 16px (`--radius-lg`), dialogs 20px. Kill the uniform `rounded-xl`-everywhere look: cards may optionally get **one 24px corner** (`rounded-tl-3xl` / locale-flipped) for hero and AI-brief moments only.
- **Arch mask** (the signature shape): media/preview frames with `rounded-t-[10rem] rounded-b-[var(--radius-lg)]` — the tower-house window silhouette. Used for: landing hero windows, onboarding live-preview, theme marketplace cards, empty-state illustration frames. 2–3 places per surface, maximum.
- **Qamariya motif** (`src/shared/brand/qamariya.tsx`): the fanlight as a parametric SVG — semicircular stained glass in five radial wedges (cobalt / amber / glass-green / amber / cobalt) divided by gypsum mullions. Token-driven, so dark mode turns it into the glowing night window. Used in: empty states, auth side panel, onboarding finale, the 404. Not a background pattern — a framed moment.
- **Khatam pattern** (`.khatam-bg` utility): the eight-pointed star grid, 3–8% ink opacity, as a *texture* where the qamariya is too heavy: sidebar footer watermark, skeleton edges, auth panel backdrop, landing section breaks.
- **Gypsum banding** (nurah trim): horizontal white double-lines capping sienna surfaces, exactly like the floor trim of a tower house — landing section dividers, the hero wall cap, banner underlines.
- **Depth:** warm shadow ramp instead of neutral shadows — `--shadow-sm: 0 1px 2px rgb(38 32 26 / .05)`, `--shadow-panel: 0 8px 24px rgb(38 32 26 / .08)`, `--shadow-overlay: 0 24px 60px rgb(38 32 26 / .16)`, plus a 1px gypsum border on dark surfaces.

### 2.4 Motion

No motion library — CSS keyframes + Tailwind 4 `@theme --animate-*` tokens (zero JS cost):

| Token | Definition | Used for |
|---|---|---|
| `--animate-rise` | 300ms `translateY(8px)→0` + fade, `--ease-out-quint: cubic-bezier(.22,1,.36,1)` | Page/section entrances, route content |
| `--animate-pop` | 180ms scale `.96→1` fade | Buttons, popovers, tooltips |
| `--animate-reveal` | 220ms `scale .98→1` + fade | Dialogs, sheets |
| `--animate-slide-in` | 260ms logical-direction translate | Sidebar, sheets, toasts |
| `--animate-shimmer` | 1.6s warm gradient sweep | Skeletons (replaces `animate-pulse` — shimmer reads as "loading", pulse reads as "broken") |
| `--animate-drift` | 12s slow gradient position shift | Landing hero sky, ambient brand panels |

Rules: **enter-only** (exits are instant or 100ms), `prefers-reduced-motion: reduce` kills all non-essential animation, lists stagger 30ms via `--stagger-i` custom property, nothing animates larger than 24px.

### 2.5 Brand assets

- **Logo:** replace the 2.1 MB unused `logo.png` with the SVG qamariya-window monogram (§2.3). Ship `logo-mark.svg` + wordmark lockups (EN: "Tujjar", AR: "تجّار") in `frontend/public/brand/`.
- Delete Next.js starter leftovers (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
- Favicon set from the new mark (`.ico`, 32/180 PNGs, maskable SVG).
- Illustration style: **geometric line compositions** (dunes, arches, souk lanterns) drawn with the pattern primitives — one component library `src/shared/brand/illustrations.tsx`, 6–8 pieces (empty orders, empty products, checkout success, 404, onboarding steps). No stock 3D blobs, no gradient blobs.

---

## 3. Token architecture (the foundation everything else sits on)

Today `globals.css` (139 lines) is the only stylesheet, and the dashboard ignores it. The fix is one file rewrite + one codemod-style sweep:

1. **Rewrite `src/app/globals.css`:**
   - `:root` light tokens + `.dark` overrides per §2.1 (values only — keep the existing `--color-*` names so storefront theme injection keeps working).
   - `@theme` registers full 50–900 ramps for primary/accent and semantic maps for success/info/warning/error, shadow scale, radius scale, font families (`--font-sans`, `--font-display`), and the `--animate-*` tokens per §2.4.
   - Add the `dark` custom variant for the dashboard too, keyframes block, `prefers-reduced-motion` guard, `lang-ar` utilities, `.prose-tujjar` styles (hand-rolled instead of adding `@tailwindcss/typography` — we control headings/links/RTL in one place and skip a dependency).
2. **Kill the split-brain:** sweep `src/shared`, `src/features`, `src/builder`, `src/app/[locale]/(dashboard)` and `admin` and replace raw `gray-*`/`blue-*`/`amber-*`/`red-*` utility classes with token utilities (`bg-surface`, `text-secondary`, `bg-primary-600`, `border-border`, `bg-surface-2`…). Checklist of known offenders: `sidebar.tsx` (`bg-primary-50 text-primary-700` is fine, but active tab blues are raw), `badge.tsx` hardcoded palette map, `toggle.tsx` raw `bg-blue-600` + nonexistent `text-muted-foreground`, underline tabs in `store-settings-form.tsx`/themes/marketplace (`border-blue-600`), builder chrome (`border-blue-400`, `bg-blue-600`), order status pill maps, admin red accents → `--color-danger-*` alias.
3. **Dashboard dark mode plumbing:** the UI store already holds theme state — wire it to toggle `.dark` on `<html>` (the storefront's pre-paint `localStorage` script from `shop/[slug]/layout.tsx` gets promoted to `src/app/[locale]/layout.tsx` so the whole app is flash-free), sync with sonner's theme, default `system`.
4. **Fonts in `src/app/[locale]/layout.tsx`:** Inter → IBM Plex Sans Arabic (arabic+latin subsets); add Fraunces + Reem Kufi as `--font-display` (loaded with `display: "swap"`, only landing/onboarding/auth pull the `font-display` class so the payload stays off dashboard routes).

---

## 4. Component system — evolve the kit in place

`src/shared/ui/*` keeps its names and APIs; each gets tokenized + dark variants. New primitives end the per-feature re-implementations.

### 4.1 Existing components → target

| Component | Today | Target |
|---|---|---|
| `button.tsx` | CVA + inline-style hack for storefront themes | Keep CVA; variants consume tokens; storefront recolors via CSS vars instead of the inline `style` (chrome.css handles it — §6.4); add `loading` prop that swaps label for the unified spinner; press = `pop` micro-motion |
| `card.tsx` | shadcn verbatim | `bg-surface`, sand border, warm `shadow-panel` on hover only for interactive cards; optional `arch` variant for brand moments |
| `dialog.tsx` | no anim, no Escape, no focus trap | `reveal` animation, backdrop warm-blur (`backdrop-blur-sm bg-[#16120D]/50`), Escape + focus trap + `role="dialog"`; used as base for a new `sheet.tsx` |
| `badge.tsx` | hardcoded palette map | status tokens (`success/info/warning/error/neutral`); indigo `shipped` pill becomes `info`; add `accent` saffron variant for AI-generated-content tags |
| `input/select/textarea` | generic | warm focus ring (terracotta), 10px radius, consistent error state, RTL-safe icon slots (fix `SearchInput`'s `left-3` → `start-3`) |
| `skeleton.tsx` | gray pulse | shimmer animation over `surface-2` |
| `empty-state.tsx` | dashed gray box + icon | khatam-pattern backdrop, geometric illustration slot, one CTA button, optional arch frame — becomes the pattern for all 20+ empty screens |
| `toggle.tsx` | raw blue, dead token | terracotta, checked motion `pop`, a11y `role="switch"` |
| `error-boundary`, `verification-banner` | — | restyle to tokens; banner gets the saffron treatment |

### 4.2 New primitives (all hand-rolled, consistent with kit philosophy)

`src/shared/ui/`:
- `table.tsx` — sortable header, sticky head, row hover, RTL-safe alignment, empty-row slot; replaces ~10 per-page hand-rolled tables (orders, products, customers, invoices, webhooks, team, audit, admin users…).
- `tabs.tsx` — underline + segmented variants (replaces per-page underline tabs).
- `dropdown.tsx` — menu primitive (replaces ~8 hand-built `absolute … py-1 shadow-lg` popovers).
- `tooltip.tsx`, `sheet.tsx` (side drawer for mobile nav + filters), `avatar.tsx` (initials, warm gradient fallbacks).
- `breadcrumbs.tsx`, `pagination.tsx`, `segmented-control.tsx` (builder device switcher + tabs reuse it).
- `command.tsx` — the Cmd+K palette (hand-rolled: overlay + input + filtered list; arrow-key nav, locales, sections: Navigate / Actions / Store / Settings / Theme).
- `spinner.tsx` — ONE spinner; migrate the 3 coexisting implementations (button SVG, border-div in `loading.tsx`, `Loader2`) to it.
- `stat-card.tsx` + `sparkline.tsx` — dashboard KPI card with delta chip + inline SVG sparkline (no chart lib for v1).
- `page-header.tsx` — the repeated `<h1 className="text-3xl font-bold">` idiom gets: eyebrow, title, description, actions slot, breadcrumb slot, RTL-safe layout.
- `kbd.tsx`, `progress.tsx`, `divider.tsx` (dune + line variants).

Charts: v1 stays hand-rolled SVG (area chart for revenue, bar chart for top products) styled by tokens; evaluate a headless chart lib later — only if the dashboard needs axes/zoom.

### 4.3 Storefront theme engine upgrades (`src/lib/color-palette.ts`, `theme-css.ts`)

- The single-hex → 50–900 HSL generator gets lightness clamps + WCAG contrast guards (min 4.5:1 for text-on-surface in generated pairs) so merchant-chosen hexes can't produce inaccessible storefronts.
- Add generated **warm neutrals**: today every theme's neutrals are gray; the generator derives sand-tinted surfaces from the base hue (hue + low saturation) — instant brand-wide warmth without touching merchant themes.
- `.prose-tujjar` styles applied to `rich-text` section + blog posts (fixes the dead `prose` classes).
- Re-tune the 8 seeded themes (`backend/apps/themes/signals.py`) to curated ramps instead of stock hexes (`#2563eb` → deep cobalt `#2D5F8C` for Modern, etc.), and add three signature themes: **Sana'a** (mudbrick sienna + gypsum, Fraunces+Plex), **Samsarah** (cobalt + glass green — the merchant inn), and **Qamariya** (amber glass, Reem Kufi + Tajawal) — themes no other platform ships, seeded like the rest.
- Theme picker (`features/pages/theme-picker.tsx`): presets become the new token ramps with live mini-preview, not flat swatch dots.

---

## 5. Surface playbooks

### 5.1 Merchant dashboard (the daily home — biggest uniqueness win)

**Shell (`src/shared/layouts/dashboard-layout.tsx`, `sidebar.tsx`)**
- Canvas: `bg-bg` warm sand; content column gets a subtle top gradient fade (dune horizon at 2% ink) — enough to feel different, not decorated.
- Sidebar: `surface-2` rail, groups get icon chips, active item = terracotta text + 3px start-edge bar (not full pill), footer carries the khatam watermark + new mark.
- Topbar (new, replaces floating bell pill): breadcrumb context + global search field (⌘K hint) + notifications popover (count, warm dot) + store/org switcher + theme toggle + locale.
- Mobile: sidebar becomes the new `sheet.tsx` drawer with staggered link rise; the current floating bell pill is removed.
- Keyboard: ⌘K palette, `g o` → orders, `g p` → products, `?` → shortcut sheet (builder already has shortcuts — reuse its infra).

**Dashboard home (`dashboard/page.tsx`) — from 4 stat cards to a cockpit:**
- Greeting header (locale-aware, "Good morning" + org name) + date + quick-action chips.
- KPI row: `stat-card` ×4 with sparklines, delta chips, warm hover.
- Revenue area chart (SVG) with range toggle (7/30/90d) hitting the existing analytics endpoint.
- Order queue list (status pills from tokens, click-through) + AI daily brief card (saffron accent, summarizes yesterday + suggestions — wires the existing AI chat backend into the surface where it's actually felt).
- Incomplete-setup checklist card (drives onboarding, §5.3) with arch-masked mini preview of the store.

**All list pages** (orders, products, customers, etc.): `page-header` + `table` + standardized toolbar (search + filters as dropdowns + bulk-select) + shimmer skeletons + pattern empty states. Status pill maps move to token classes.

### 5.2 Auth (first touch — currently "centered card on gray")

Split screen for `login`, `register`, `verify-email`, `reset-password`:
- Brand panel (55%): khatam pattern over the dune gradient, rotating merchant quotes (EN/AR), the arch-framed mark, "Connect — Operate — Grow" set in Fraunces/Reem Kufi.
- Form panel: warm surface, `surface-2` inputs, 2FA/verification flows restyled, RTL-native.
- Mobile: brand panel collapses to a slim header band with the pattern.

### 5.3 Onboarding wizard + landing (the two "wow" moments)

**Onboarding (new, `dashboard/onboarding`):** replaces register → empty dashboard (audit's #1 UX gap):
1. Name your souk (+ subdomain preview) 2. Pick a look (theme cards, arch-masked live previews) 3. Add first products (manual, CSV, or AI-draft — showcases the AI differentiator) 4. Launch — finale with dune gradient + first-visit checklist card pinned to dashboard home.
Each step updates a **live storefront preview** on the side (reusing builder preview infra) — the merchant watches their store assemble itself. This is the demoable signature moment.

**Landing (`src/app/[locale]/page.tsx`):** from "two buttons on a gradient" to a full marketing page:
- Hero: Fraunces/Reem Kufi headline, dune-gradient sky with drift animation, arch-masked product imagery, EN/AR script toggle that actually switches the hero copy in place (bilingual-native as a *feature demo*).
- Value strip, feature grid (motif-iconed cards), AI showcase (brief-style card), interactive builder teaser (scroll-triggered section stack), themes carousel (real theme cards), open-source/self-host callouts, pricing 3-tier (saffron premium chip), testimonials, FAQ, footer with pattern.
- Every section break uses the dune divider; final CTA band is the only second use of the signature gradient.

### 5.4 Page builder (`src/builder`)

Structure is solid (DnD, undo/redo, autosave, versioning) — restyle, don't rebuild:
- Shell tokens: toolbar = `surface` with segmented device control; rails get `surface-2`; canvas stays neutral-warm so sections pop; selection ring → terracotta with glow `shadow-ring` instead of raw blue.
- Toolbar diet: ~12 same-weight buttons → primary actions (Save/Publish, Add Section), grouped icon actions with tooltips, history/theme/presets into dropdowns — calmer, more pro.
- Inspector: segmented tabs, tokenized color fields with suggested ramps, spacing fields with live dune-grid ghosting.
- Empty canvas & section palette get pattern illustrations; drag overlay gets `pop` motion; drop zones warm-dashed terracotta.
- Section previews: hero/gallery/banner sections get arch-mask options as presets (they render in the builder canvas and storefront identically).

### 5.5 Public storefront (`shop/[slug]/*`)

- **Chrome refactor (`features/storefront/chrome.tsx`, 534 lines):** replace the ~10 inline-style + JS-hover blocks (`style={{ color: "var(--color-text-secondary)" }}`, `onMouseEnter`/`onMouseLeave`) with a new `storefront.css` of classes consuming the injected CSS vars (`sf-link`, `sf-link:hover`, `sf-btn`, `sf-card`…). One file, cacheable, dark-mode aware — and unlocks every future improvement.
- Product cards: arch-variant images (per-theme option), quick-add popover, wishlist heart with `pop`, consistent price/discount tokens; listing gets sort/filter dropdowns + result count (audit gap) using kit primitives.
- Cart/checkout: multi-step checkout (contact → address → shipping → payment → review) with a logical-progress rail, sticky order-summary sheet, trust badges, and the success page gets the arch illustration moment; skeleton shimmer everywhere.
- Announcement bar/header/footer keep their layout configurability — restyled through the new classes + generated warm neutrals.

### 5.6 Admin panel

Same family, distinct accent: danger/rose accent retained for platform power (staff-only identity), sand surfaces shared with the merchant dashboard, its own monogram badge (shield mark) — coherent product suite, not a bolt-on.

---

## 6. UX flow & quality upgrades (beyond skin)

1. **Command palette ⌘K:** navigate + search products/orders/customers (existing search API) + actions (new product, new discount, toggle dark, switch locale) — the pro-tool feel.
2. **Breadcrumbs** on deep routes (products/[id], orders/[id], stores/[id]…) via `breadcrumbs.tsx` + `page-header`.
3. **Loading standard:** every data page = shimmer skeletons matching final layout heights (kill inconsistent `h-16`/`h-64`/`h-96` divs); route `loading.tsx` = layout-matched shell, not centered spinner.
4. **Empty states:** every list/report gets illustration + one CTA ("Add your first product" actually opens the form). Inventory audit list: ~20 screens.
5. **Mobile:** drawer nav (§5.1), touch targets ≥44px, sticky action bars on tables, filters as bottom sheets.
6. **RTL & i18n fixes:** `left-3`→`start-3`, `right-0`→`end-0` sweep; uppercase/tracking classes conditional for Arabic; hardcoded strings ("Add Your First Section", theme-picker labels, "Overridden") into `messages/{en,ar}.json`; AR gets display typography parity.
7. **A11y pass:** focus-visible rings (terracotta, 2px offset) everywhere, dialog focus traps, `prefers-reduced-motion`, AA contrast enforced by the palette generator (§4.3).
8. **Performance:** next/font with arabic+latin subsets (Arabic glyphs stop re-rendering as fallback), inline SVG motifs (no raster patterns), delete 2.1 MB logo + starter SVGs, storefront.css cacheable (§5.5).

---

## 7. Roadmap (phased, low-risk, shippable increments)

### Phase 0 — Foundation & hygiene (1–2 days) ✅ *complete*
- [x] Rewrite `globals.css` tokens (light+dark) + keyframes + `lang-ar` utilities + `.prose-tujjar` (§3.1)
- [x] Fonts: IBM Plex Sans Arabic + Fraunces + Reem Kufi in `[locale]/layout.tsx`; pre-paint dark script app-wide (`tujjar-dashboard-theme`)
- [x] Delete Next starter SVGs + 2.1 MB `logo.png`; ship SVG qamariya-window mark + favicon (`public/brand/`, `src/app/icon.svg`) — README/README_AR updated
- [x] Unify spinner (`spinner.tsx`), remove dead `text-muted-foreground`
- [x] Tokenize the whole shared kit + dashboard/admin shell (button, card, badge, toggle, skeleton, empty-state, dialog + Escape/aria, input/select/textarea, search-input + `start-3` RTL fix, locale-switcher/toggle, verification-banner, error-boundary, dashboard-layout, sidebar, admin layout) — active nav = sienna text + 3px start bar; sidebar gets `ThemeToggle`
- [x] Wire dead `prose` classes to `.prose-tujjar` (blog post, Tiptap editor, rich-text & custom-html builder sections)
- [x] Fix RTL drawer slide in sidebar (`-translate-x-full rtl:translate-x-full`)
**Exit criteria:** dashboard renders in new palette with zero layout breakage; dark toggle works app-wide; CI green.

### Phase 1 — Tokenize the kit & kill raw colors (3–5 days) 🔄 *core complete*
- [x] Restyle all `src/shared/ui` + new primitives: table, tabs, dropdown, tooltip, sheet, breadcrumbs, pagination, segmented-control, avatar, stat-card, sparkline, page-header (§4)
- [x] Sweep dashboard/builder/admin/auth raw `gray/blue/red/amber` → tokens — **150 files, 2,581 replacements via a scoped codemod** (storefront + builder sections excluded: they're theme-var driven, Phase 4/5 scope); RTL physical→logical utility fixes (`left/right/pl/pr/ml/mr`, `text-left/right`); skeleton pulse → shimmer; status pill maps → semantic pairs; two permanently-dark code boxes pinned to fixed values
- [x] Dialog: animation + Escape + focus trap; sonner themed; skeletons → shimmer; empty-state → pattern version
- [x] Dashboard home → `PageHeader` + `StatCard` (delta chips, tone icons)
- [x] Self-host all three brand fonts (`public/fonts`, 368 KB, unicode-range preserved) — builds no longer depend on fonts.googleapis.com
- [x] Migrate list pages to `Table`/`PageHeader`: orders, customers (flagships) + taxes, discounts, customer loyalty, admin users/organizations/stores — inventory's collapsible grids intentionally kept bare (embedded context); page wrappers on the top nav pages + admin; `PageHeader` codemod converted the 9 exact-idiom wrappers, ~19 variant headers stay for Phase 2's breadcrumbs/detail-header pass
- [x] Adopt `Tabs`/`Dropdown` where hand-rolled: team (with badge chips + `PageHeader`), account settings, builder inspector, products page tabs, per-card product menu — killed the last two `Loader2` spinners in the process
**Exit criteria:** grep for raw palette classes in src/ returns only ramp definitions; every list page uses table.tsx/pattern components.

### Phase 2 — Dashboard shell & home (3–4 days) 🔄 *core complete*
- [x] Topbar: sticky glass bar with global search trigger (⌘K/Ctrl+K hint), notifications popover, theme + locale toggles; mobile topbar gains a search icon; floating bell pill removed
- [x] `command.tsx` palette: ⌘K / Ctrl+K from anywhere, arrow-key navigation, Enter to open, Esc to close — navigates all 25 dashboard pages (shared `dashboard-nav.ts` config, same source as the sidebar), live search over products/orders/customers/pages/collections/categories via the unified search API, and actions for theme + locale
- [x] Dashboard home additions: AI daily brief card (explicit Generate — never auto-fires, respects AI credits; amber accent + khatam corner) + data-driven setup checklist (store/product/billing, disappears when complete) — i18n keys in both locales
- [x] Breadcrumbs + `PageHeader` on the flagship detail pages (orders/[id] with status pill in actions, customers/[id]); purple status remnant fixed in the order detail map
- [ ] Breadcrumbs on the remaining detail pages (stores/[id], themes/[id], templates/[id], blog/[id], categories/collections/[id], domains)
**Exit criteria:** ⌘K opens and reaches any page in ≤2 keystrokes; home shows live data with sparklines; screenshots pass the uniqueness test.

### Phase 3 — Auth + landing + onboarding (4–6 days) ✅ *core complete*
- [x] Split-screen auth (`AuthShell`): qamariya-lit brand panel over the signature gradient with khatam texture, rotating Old Sana'a merchant quotes (authored bilingually, clickable dots), Fraunces/Reem Kufi headline, qamariya window at the base — collapses to a gradient band on mobile. All four auth pages wrapped (login ×2 branches incl. 2FA, register, reset-password, verify-email)
- [x] Landing page: sticky glass nav · hero with eyebrow chip, display type + kufi line, the mudbrick wall with three qamariya windows · bilingual-native live demo (SegmentedControl flips a product record between scripts, arch-framed mock image, AI-drafted badge) · feature grid (4 tone chips) · themes strip (Sana'a / Samsarah / Qamariya cards) · 3-tier pricing with gradient "Popular" chip · CTA band + footer. Server page + `generateMetadata`; ~60 i18n keys in EN + AR
- [x] Onboarding wizard (`/dashboard/onboarding`, register now lands here): 4 steps — name + live slug availability check (`useCheckSlug`, debounced) → theme picker from system themes → optional first product → launch (wizard endpoint + `setTheme` + product, graceful degradation) — with a **live preview mock** that restyles as the merchant picks; gradient finale with qamariya + "Your souk is open!". Dashboard setup checklist links to it
- [ ] Polish: testimonials/FAQ sections on landing; wizard as full-screen focused layout (currently inside the shell)
**Exit criteria:** new-merchant path register→launched-store ≤5 minutes without docs; landing demonstrates EN/AR toggle + themes.

### Phase 4 — Builder restyle (2–3 days) ✅ *core complete*
- [x] Toolbar diet: 12 same-weight buttons → 3 weighted primary actions (Add Section / Save / Publish) + 8 icon-only secondary actions with tooltips; device switcher stays segmented
- [x] Selection ring → sienna + warm glow (`border-primary-500 shadow-panel`); drag overlay gets `pop` motion; empty canvas → `EmptyState` with bilingual copy
- [x] Inspector color fields get brand palette swatches (mudbrick/amber/cobalt/glass-green/ruby)
- [x] Hero section: "Frame Shape" (flat / Sana'a-window arch) + "Arched" preset — renders identically in builder + storefront
- [ ] Nice-to-have skipped: spacing-field dune-grid ghosting
**Exit criteria:** builder fully dark-mode-correct; no raw blue classes; inspector fields tokenized.

### Phase 5 — Storefront & themes (4–6 days) 🔄 *partial*
- [x] **Signature themes seeded**: Sana'a (mudbrick+gypsum, Fraunces/Plex), Samsarah (cobalt+glass green), Qamariya (amber glass, Reem Kufi) appended to `backend/apps/themes/signals.py` `THEMES_DATA` with Default/Dark/color presets — run `python manage.py seed_themes` to install
- [x] Theme picker presets retuned from stock hexes to brand ramps (Mudbrick / Cobalt / Glass Green / Elegant / Amber)
- [x] `chrome.tsx` → `globals.css` `.sf-*` class system: all ~13 inline-style + JS-hover blocks (nav links, icon buttons, CTA, cart badge, socials, footer links, search input, mobile nav, header/footer shells) converted to cacheable classes that consume the injected theme vars — no JS hovers remain
- [x] Palette generator: verified contrast-adequate (fixed Tailwind lightness scale → 600≈L40 for buttons); left `color-palette.ts` WIP untouched
- [ ] Storefront listing sort/filter, multi-step checkout polish, success-page arch moment
**Exit criteria:** theme switch updates live without JS style churn; all seeded themes AA-contrast verified; checkout full-flow clickable end-to-end.

### Phase 6 — Flow polish & QA (3–4 days) 🔄 *partial*
- [x] RTL sweep: physical-direction utilities verified clean across the tokenized scope (only intentional tooltip centering + storefront chrome remain)
- [ ] Hardcoded-string i18n pass (builder copy localized; theme/proper-noun names intentionally kept English)
- [ ] Keyboard-only + RTL parity walkthrough; Lighthouse ≥95; visual-regression screenshots (Playwright)

**Total: ~3–4 weeks solo dev.** Phases 0–2 alone transform the day-to-day product; each phase ships independently and keeps CI green.

---

## 8. Validation & success metrics

| Signal | Measure |
|---|---|
| Uniqueness | Cropped/grayscale screenshot test; side-by-side vs. 3 reference SaaS tools — no visual overlap in type, color, or shape |
| Consistency | `grep -r "bg-gray-|text-blue-\|text-red-" src/` (excl. globals.css) = 0 hits; one spinner, one empty-state, one popover pattern |
| Accessibility | WCAG AA both modes/both scripts; keyboard-only + screen-reader pass on dashboard + checkout |
| Bilingual | Arabic dashboard uses Plex Arabic (no system-font fallback screenshots), RTL has zero physical-direction bugs |
| Performance | Landing & dashboard Lighthouse ≥95; no font/layout shift from dark pre-paint; font payload ≤ 3 families, subsets arabic+latin |
| Product | Audit table gaps closed: onboarding ✅, Cmd+K ✅, breadcrumbs ✅, full-screen theme preview (onboarding live preview covers it) ✅ |

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Theme-engine coupling: merchant themes auto-generate ramps from one hex; new warm-neutral logic could shift existing stores | Generator changes behind a version flag; regenerate & screenshot all 8 seeds + example theme before release |
| Scope creep ("just one more component") | Evolve-in-place rule: no new deps except the SVG chart decision deferred post-v1; new primitives only when ≥3 usages exist |
| Motion & pattern overuse turning "distinct" into "noisy" | Budget rules in §2.3 (2–3 arch moments, 3–8% pattern opacity, one signature gradient per surface); reviewed per phase |
| Frontend tests break on restyled components | Phase 1 updates test queries alongside styles; Phase 6 adds visual regression to catch drift |
| Arabic font payload | subsets arabic+latin only, `display: swap`, display faces loaded only on landing/onboarding/auth routes |

---

## 10. The one-line summary

**Tujjar stops looking like a template the day its surfaces turn warm sand instead of cold gray, its type speaks both scripts natively, its accents glow kiln-terracotta and saffron, and its signature motifs — arch frames, khatam patterns, dune dividers — appear exactly where a moment deserves emphasis: all achievable by evolving the existing kit, starting with `globals.css` and the component sweep.**
