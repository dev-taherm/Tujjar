# Tujjar Shopify Competitiveness Audit

> **Revision note (Nov 2026):** This audit has been updated to reflect the current state, including the completed **Old Sana'a UI/UX redesign** (see the new "UI/UX Redesign Status" section). Commerce, security, SEO and operational gaps are re-checked and remain the primary blockers to a paid launch. See also `UI_UX_REDESIGN_PLAN.md` for the design roadmap.

## Executive Summary

Tujjar is a real, feature-rich commerce SaaS foundation with backend modules for auth, organizations, stores, products, orders, customers, pages, themes, templates, media, search, analytics, billing, AI, notifications, and marketplace functionality.

The **frontend has been completely redesigned** since the original audit — a bespoke "Old Sana'a" design language (mudbrick + gypsum palette, qamariya glass accents), bilingual-native typography (IBM Plex Sans Arabic + Fraunces + Reem Kufi), app-wide dark mode, a shared component kit, a ⌘K command palette, a first-run onboarding wizard with live preview, a split-screen auth experience, and a full marketing landing page. The dashboard is no longer a stock shadcn/Tailwind clone.

The product is still **not Shopify-competitive as a public, enterprise-grade commerce platform**. The weakest parts remain checkout/payments, billing enforcement, storefront SEO, analytics completeness, tenant isolation hardening, and operational maturity. The redesign made it *look and feel* finished and unique; it did not close the commerce workflows.

**Overall assessment: visually distinctive alpha platform with a solid foundation — not ready for a public paid launch.**

## Overall Scores

| Area | Score / 10 | Δ | Notes |
|---|---:|---:|---|
| Architecture | 6.5 | — | |
| Code Quality | 6.5 | — | |
| Scalability | 5.5 | — | |
| Maintainability | 6.5 | ↑ | Token system, shared primitives, single spinner/table/tab/empty-state |
| Performance | 6.0 | ↑ | Self-hosted fonts, offline-reproducible builds; storefront still client-heavy |
| Security | 6.0 | — | One tenant-scoping bug in `set-theme` fixed |
| UX | 7.5 | ↑↑ | Full design system, onboarding, ⌘K, dark mode, RTL-correct |
| SEO | 4.0 | — | Storefront SEO largely unchanged |
| Testing | 5.5 | ↓ | Backend suite solid; frontend tests can't run locally (Node 20.9 < vitest 4 requirement); no E2E |
| Documentation | 6.0 | — | |
| Developer Experience | 7.5 | ↑ | Offline builds, codemods, shared nav config, primitives |
| Product Completeness | 4.5 | — | Commerce workflows unchanged |

## Shopify Competitiveness

- Estimated completeness versus Shopify: **~42%** (UI/UX raised the floor; commerce features still the ceiling)
- Features already competitive: multi-store foundation, product CRUD, page builder (drag-and-drop, undo/redo, autosave), theme/template system (now 11 themes incl. 3 signature), AI abstraction, audit logs, Docker, CI, **plus a distinctive, bilingual-native frontend** no competitor ships
- Features partially competitive: orders, analytics, storefront, notifications, marketplace, media, billing
- Features missing entirely or too shallow: real checkout/payments, taxes, shipping, refunds, returns, customer portal, advanced SEO, observability, backups, robust tenant switching

## UI/UX Redesign Status *(new)*

Completed across the frontend (see `UI_UX_REDESIGN_PLAN.md`):

- **Design system** — "Old Sana'a": mudbrick-sienna primary ramp, gypsum canvas, qamariya-glass status colors, warm "Qamariya Night" dark mode, arch/khatam/qamariya motifs. Tokens in `globals.css`; raw Tailwind palette classes swept (~150 files) to semantic tokens.
- **Typography & i18n** — self-hosted IBM Plex Sans Arabic (both scripts) + Fraunces/Reem Kufi display faces; RTL-correct across the dashboard; ~60 new EN+AR message keys for landing/onboarding.
- **Kit** — hand-rolled primitives (Button, Card, Badge, Input/Select/Textarea, Dialog with Escape+aria, Toggle, Skeleton shimmer, EmptyState, Tooltip, Sheet, Avatar, Breadcrumbs, Pagination, SegmentedControl, Tabs, Dropdown, StatCard + Sparkline, PageHeader, Spinner, CommandPalette).
- **Dashboard shell** — glass topbar (global search trigger, notifications, theme + locale toggles), ⌘K command palette reaching all pages + live entity search, breadcrumbs on detail pages.
- **Dashboard home** — live StatCards with delta chips, AI daily brief (explicit generate, credit-aware), data-driven setup checklist.
- **Auth** — split-screen `AuthShell` with rotating Old Sana'a merchant quotes (bilingual), qamariya windows.
- **Landing** — full marketing page: hero with qamariya windows, bilingual-native live demo, feature grid, theme showcase, pricing, CTA band.
- **Onboarding** — 4-step wizard (name + live slug check → theme picker → optional first product → launch) with a live preview mock.
- **Builder** — toolbar diet (3 primary actions + icon tools), sienna selection ring, drag `pop` motion, empty-canvas pattern, brand color swatches, hero "arch" frame preset.
- **Storefront chrome** — inline-style + JS-hover removed in favor of a `.sf-*` class system consuming injected theme vars.
- **Themes** — 3 signature themes seeded (Sana'a, Samsarah, Qamariya) + theme-picker presets retuned to brand ramps.

Bugs fixed during this work: jsdom-backed server sanitizer (build breaker) → `sanitize-html`; `useSearchParams` Suspense boundaries; self-hosted fonts (removed the flaky `fonts.googleapis.com` build dependency); hydration warning from the pre-paint theme script; onboarding theme list truncation; `set-theme` tenant-scoping (system themes were invisible).

## Comparison Table

| Feature | Current Status | Completeness % | Priority | Recommendation |
|---|---:|---|---:|---|
| Auth and organizations | Implemented | 75% | High | Stronger org context handling; fix session-drop-on-reload |
| Products and variants | Implemented | 75% | High | Richer variant modeling, bulk editing, stronger validation |
| Cart and checkout | Partial | 55% | Critical | Complete address→shipping→payment→confirmation with webhooks verified |
| Orders and fulfillment | Partial | 45% | Critical | Refunds, returns, fulfillment workflows, reconciliation |
| Customers | Partial | 50% | High | Customer portal, saved addresses, account history |
| Collections and categories | Implemented but imperfect | 70% | High | Fix storefront collection filter; rule-based collections |
| Media library | Partial | 60% | Medium | MIME validation, scanning, size limits, bulk actions |
| Search | Partial | 55% | Medium | Faceting, typo tolerance, relevance tuning |
| Analytics | Partial | 40% | High | Replace stubbed metrics with fully computed dashboards |
| Theme engine and builder | Strong | 70% | Medium | Schema validation, version diffs, SSR storefront rendering |
| AI integrations | Partial | 60% | Medium | Analytics assistant, SEO generator, workflow integration |
| Billing | Partial | 35% | Critical | Real payment processor + entitlement enforcement |
| Marketplace | Partial | 50% | Medium | Moderation, permissions, install lifecycle, billing |
| Production ops | Partial | 30% | Critical | Monitoring, backups, disaster recovery, error tracking |

## Core Commerce Review

### Supported

- Store creation and management (incl. onboarding wizard)
- Product CRUD, variants, categories, collections
- Inventory tracking
- Cart and checkout skeleton (routes + Stripe SDK present)
- Order creation and lifecycle transitions
- Customer management
- Media library
- Search (Postgres FTS)

### Missing or Incomplete

- Real payment processing (end-to-end)
- Taxes
- Shipping rates and labels
- Refunds
- Returns
- Discounts and coupons (modeled, storefront application incomplete)
- Customer self-service portal
- Wishlists / reviews / saved addresses (partially modeled, UX incomplete)

## Builder Review

### Theme System

- Theme installation: partial
- Theme switching: implemented (`set-theme`, incl. system themes — tenant-scoping bug fixed)
- Theme versioning: partial
- Theme customization: partial
- Signature themes: **Sana'a, Samsarah, Qamariya** (seeded)

### Template System

- Installation: implemented
- Preview: implemented
- Import/export: implemented
- Versioning: partial

### Section Builder

- Reordering: implemented
- Configuration: implemented (schema-driven, brand color swatches, arch presets)
- Duplication: implemented
- Responsive behavior: partial

### Drag-and-Drop Builder

- Visual editing: implemented
- Layer tree: partial
- Inspector: implemented (segmented tabs)
- Undo/redo: implemented
- Autosave: implemented (5s interval)
- Responsive editing: partial
- Version history: implemented

## AI Features Review

### Present

- AI provider configuration (6 providers)
- AI conversation flow
- AI content generation
- AI product generation
- AI daily brief on the dashboard home (explicit generate — credit-aware)

### Missing or Weak

- AI analytics assistant is not fully realized
- AI customer support is not deeply integrated
- No workflow automation or merchant approval flow
- No strong guardrails for prompt injection, content moderation, or cost control

## Architecture Review

### Strengths

- Modular Django app layout, separation by domain
- Audit logging
- Clear API segmentation
- Background tasks and cache primitives
- Frontend: token system, shared primitives, single source of truth for nav (`dashboard-nav.ts`)

### Weaknesses

- Tenant selection is too tied to the JWT claim
- Some business logic still lives in viewsets
- Analytics and checkout logic should move into dedicated service layers
- JSON builder content needs versioned schema validation
- Auth session drops on full page reload (zustand-persist rehydration race)

## Security Review

### Issues

- Category assignment is not tenant-scoped in the product serializer
- File upload validation is extension-based and too weak
- Tenant context depends heavily on a JWT claim
- Rate limiting present but not deeply tuned by risk surface
- Public storefront and media flows need more validation and hardening

### Positive Signals

- Password reset and verification tokens are hashed
- 2FA secrets are encrypted
- JWT auth used consistently (with working auto-refresh)
- CSRF middleware enabled
- Production settings tighten security headers
- Server-side HTML sanitization (`sanitize-html`) for merchant-authored blog content

## Performance Review

### Bottlenecks and Risks

- Storefront is client-heavy and less SEO/performance-friendly
- Analytics returns placeholder fields
- Recursive and count-heavy serializers may trigger N+1 at scale
- Large catalog pages need more caching and pagination tuning

### Positives Since Last Audit

- Fonts are self-hosted (no third-party font CDN; builds are offline-reproducible and faster)
- Storefront chrome styling is now a cacheable `.sf-*` stylesheet (no JS hover handlers)

### Recommendations

- Server-render storefront and public product pages
- Cache store and theme payloads
- Push analytics rollups into scheduled jobs
- Reduce query count in nested serializers

## UX Review

### Resolved (since original audit)

- Dashboard landing no longer static/zeros — live stat cards with deltas, AI brief, setup checklist
- Generic, unbranded storefront/dashboard → full Old Sana'a design system + signature themes
- First-run onboarding exists (4-step wizard with live preview)
- Empty states are patterned and consistent; keyboard shortcuts (⌘K) implemented
- Builder autosave and unsaved-change indicators exist

### Remaining

- Storefront browsing UX (sort/filter/search controls on listings) is still thin
- Checkout flow polish (progress rail, success state)
- Full-screen onboarding (currently runs inside the dashboard shell)
- Some builder/dashboard copy is still hardcoded English
- Auth session drops on full page reload

## SEO Review

### Present

- Basic metadata exists; store layout generates per-store title/description/OG/canonical
- `robots.ts` and `sitemap.ts` exist; per-store robots/sitemap rewrite to the backend

### Missing or Weak

- No complete route-level metadata strategy for storefront products/collections/pages
- No visible structured-data completeness (product/org markup partial)
- Storefront is client-heavy, hurting crawlability

### Recommendations

- Server-render storefront pages (already partially server-rendered via the shop layout)
- Dynamic metadata per store, product, collection, page
- Structured data for products and organization markup

## Testing Review

### Strengths

- Backend test suite is broad; login, auth, product, order, store, page, billing, analytics, notifications, search are covered

### Gaps

- Frontend tests are thin and **cannot run on the dev machine's Node 20.9** (vitest 4 requires Node ≥20.12) — CI must own this
- No E2E coverage for core commerce flows
- No coverage for tenant switching, checkout, refunds, or SSR storefront behavior

### Estimated Coverage

- Backend: moderate to good
- Frontend: low
- End-to-end: missing

## Production Readiness Checklist

| Item | Status |
|---|---|
| Docker | Complete |
| CI | Partial |
| Monitoring | Missing |
| Logging | Partial |
| Health checks | Partial |
| Error tracking | Missing (Sentry DSN placeholder, no SDK) |
| Backups | Missing |
| Disaster recovery | Missing |
| Environment management | Partial |
| Documentation | Partial |

## Missing Features

### Critical

- Real payment processing
- Taxes
- Shipping rates and labels
- Refunds and returns
- Discounts/coupons applied at storefront checkout
- Observability
- Backups and disaster recovery
- Tenant switching / improved tenant isolation

### High

- Customer portal
- Reviews / wishlists UX
- Rules-based collections
- Better analytics
- Webhooks and eventing (outbound webhooks exist; verify coverage)
- Storefront SSR and SEO

### Medium

- Faceted search
- Multi-currency
- AI analytics assistant
- Theme diff/version UI
- Marketplace moderation
- Full i18n of remaining hardcoded strings

### Low

- Visual-regression test suite
- More demo templates
- Saved views

## Broken or Incomplete Features

| Bug | Location | Severity | Status |
|---|---|---:|---|
| Storefront collection filter uses the wrong relation name | `backend/apps/storefront/views.py` | High | Open |
| Product categories are not tenant-scoped on write | `backend/apps/products/serializers.py` | Critical | Open |
| Analytics summary returns stubbed metrics | `backend/apps/analytics/views.py` | High | Open |
| Dashboard home hardcoded/static | `frontend/src/app/[locale]/(dashboard)/dashboard/page.tsx` | Medium | **Fixed** — live StatCards, AI brief, checklist |
| Storefront is client-only and SEO-light | storefront pages | High | Partial — server-rendered layout + metadata exist; browse/pagination still client |
| Tenant selection bound to first org membership | `backend/apps/authentication/serializers.py` | High | Open |
| Upload validation is weak | `backend/apps/media/services/__init__.py` | High | Open |
| `set-theme` 404 for system themes (tenant-scoped manager) | `backend/apps/stores/views.py` | High | **Fixed** — `Theme.unscoped` |
| Onboarding theme picker truncated (`slice(0,8)`) | `frontend/src/features/onboarding/onboarding-wizard.tsx` | Medium | **Fixed** |
| Auth session drops on full reload | auth store / dashboard guard | High | Open |

## Architecture Improvements

- Separate tenant resolution from login
- Move checkout and inventory into a commerce service layer
- Add versioned JSON schema validation for builder content
- Move analytics aggregation into scheduled rollups
- Normalize RBAC and permission handling
- Fix auth persistence/rehydration race

## Performance Improvements

- Server-render storefront pages
- Cache store/theme/template payloads
- Reduce nested serializer query counts
- Add pagination and virtualization for large lists
- Use background jobs for analytics and indexing

## Security Improvements

- Scope every tenant-linked queryset (one fixed; audit the rest)
- Harden file uploads
- Add more endpoint-specific throttles
- Review public APIs for data leakage
- Document secret management and rotation

## UX Improvements

- ~~Replace static dashboard values~~ done
- ~~Add first-run onboarding~~ done
- ~~Add autosave and version previews in the builder~~ done
- ~~Keyboard shortcuts~~ done (⌘K)
- ~~Better empty states and bulk actions~~ done
- Storefront sort/filter/search polish (open)
- Checkout progress + success state (open)
- Full i18n of remaining hardcoded strings (open)

## Launch Readiness

- Current readiness: **58%**
- Can it launch today as a paid Shopify alternative? **No**
- Can it support a private alpha or internal pilot? **Yes** — with a distinctive, professional UI now
- Must-fix blockers before paid onboarding:
  - Payments and checkout
  - Taxes and shipping
  - Refunds and returns
  - Tenant isolation and switching
  - Storefront SSR and SEO
  - Monitoring and backups
  - Auth session persistence (reload drops login)
  - Frontend test suite runnable in CI

## Final Verdict

Tujjar has gone from a *generic* alpha to a **visually distinctive, bilingual-native** alpha. The complete Old Sana'a design system, onboarding flow, command palette, and storefront chrome are real, working assets that no other commerce SaaS ships. However, the platform still lacks the deep commerce workflows — real payments, taxes, shipping, refunds, billing enforcement — and the operational maturity (observability, backups, error tracking, test coverage) required to onboard paying customers at scale. The redesign cleared the "feels unfinished" barrier; the "runs a real business" barrier is the next mountain.
