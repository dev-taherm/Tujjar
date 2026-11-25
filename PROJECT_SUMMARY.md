# Tujjar — Complete Project Summary

> **Tujjar** (تجّار, Arabic for *merchants*) — the open-source, AI-powered, multi-tenant marketplace platform.
> *Connect — Operate — Grow.*

A self-hosted Shopify-alternative SaaS: one instance hosts many organizations, each running one or more online stores with their own storefront, theme, page-builder-built pages, catalog, orders, customers, and AI tooling.

- **License:** MIT
- **Version:** 0.1.0 (initial public feature set; see `CHANGELOG.md`)
- **Author:** Taher Mahram (`dev-taherm`) — see also `README.md` (EN) and `README_AR.md` (AR)

---

## 1. Repository Layout

```
Tujjar/
├── backend/                     # Django 4.2 + DRF API server
│   ├── apps/                    # 24 modular Django apps (feature domains)
│   ├── config/                  # settings (base/dev/prod/testing), urls, celery
│   ├── tests/                   # pytest suite: unit/ (35 files), factories/
│   ├── conftest.py              # shared pytest fixtures (user, org, store, product…)
│   ├── bootstrap_demo.py        # demo org/store seeder
│   └── pyproject.toml           # Python deps, ruff, mypy, pytest config
├── frontend/                    # Next.js 16 + React 19 + TypeScript
│   ├── src/app/[locale]/        # App Router: (auth), (dashboard), admin, shop/[slug]
│   ├── src/api/                 # Axios clients + React Query hooks per domain
│   ├── src/builder/             # Drag-and-drop page builder engine
│   ├── src/features/            # 20+ feature UI modules
│   ├── src/shared/              # UI kit, types, layouts, utils
│   ├── src/stores/              # Zustand stores (auth, UI, customer, guest cart)
│   └── messages/{en,ar}.json    # i18n dictionaries
├── docker/                      # nginx / postgres / redis configs
├── docker-compose.yml           # Dev stack (7 services)
├── docker-compose.prod.yml      # Production stack
├── examples/custom-theme/       # Example theme JSON (theme, presets, homepage)
├── Makefile                     # All dev commands
├── .env.example                 # Environment template
└── .github/workflows/ci.yml     # CI: lint + backend tests (≥80% cov) + frontend tests
```

---

## 2. Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Backend | Django 4.2 + Django REST Framework, Python 3.10+ (typed, `mypy --strict`) |
| Auth | JWT via SimpleJWT (15 min access / 24 h refresh, rotation + blacklist), TOTP 2FA, Fernet-encrypted secrets |
| Database | PostgreSQL 16 + pgvector (SQLite fallback in dev/tests) |
| Cache / broker | Redis 7 (cache, sessions, Celery broker) |
| Background jobs | Celery 5 + django-celery-beat (DatabaseScheduler) + django-celery-results |
| Storage | MinIO / AWS S3 via django-storages (S3-compatible media) |
| AI | LiteLLM + LangChain over a custom multi-provider abstraction (6 providers) |
| Payments | Stripe SDK (Checkout Sessions + signed webhooks), COD, bank transfer |
| API docs | drf-spectacular → Swagger `/api/docs/`, ReDoc `/api/redoc/`, schema `/api/schema/` |
| Frontend | Next.js 16 (App Router, standalone output) + React 19 + TypeScript 5 |
| UI | Tailwind CSS 4 (CSS-first config), hand-rolled shadcn-style kit on Radix-style primitives, CVA, lucide icons |
| State | Zustand 5 (persist) for client state, TanStack React Query 5 for server state |
| Forms | React Hook Form + Zod |
| DnD | dnd-kit (page builder) |
| Rich text | Tiptap 3 (blog editor) |
| i18n | next-intl — English + Arabic with full RTL |
| Testing | pytest + factory-boy (backend), Vitest + Testing Library (frontend) |
| Lint/types | ruff + mypy (backend), ESLint + tsc (frontend) |
| CI/CD | GitHub Actions (lint, backend tests with coverage gate, frontend tests), Dependabot |

---

## 3. Architecture Overview

Classic modular monorepo with three cleanly separated surfaces:

1. **Merchant dashboard** (client-side SPA-style, JWT-guarded, React Query + Zustand)
2. **Public storefront** (server-rendered Next.js pages, ISR + cache tags, client islands)
3. **REST API** (Django, versioned under `/api/v1/`, JWT-protected except public storefront endpoints)

### Multi-tenancy model (backend backbone)

- Every tenant row carries an `organization` FK.
- `TenantMiddleware` (`apps/core/middleware.py`) parses the JWT's **`org_id` claim**, validates the org is active (Redis-cached 60 s), and stores it in thread-local state.
- `TenantManager` (`apps/core/managers.py`) auto-filters every queryset by that org; `.unscoped` manager escapes tenancy for platform-level code.
- `TenantViewSet` / `TenantReadOnlyViewSet` (`apps/core/viewsets.py`) wire tenancy + RBAC + audit logging into every ViewSet.
- RBAC: `Organization` → `Role` (6 roles, 25 permissions, e.g. `products.create`, `billing.manage`, `ai.use`) → `OrganizationMembership`; enforced fail-closed by `HasOrganizationPermission`; platform admins bypass via `IsPlatformAdmin`.
- Org switching: `POST /api/v1/auth/switch-org/` reissues a token with the new `org_id`.

### Dual authentication realms

| Realm | Who | How |
|---|---|---|
| Platform/merchant | Dashboard users | `apps/authentication` — email login, register + email verification (SHA-256-hashed tokens), password reset, JWT refresh/logout, **2FA (TOTP + backup codes)**, org switching |
| Storefront customer | Shoppers per store | `apps/customers/auth_views.py` — per-store register/login/refresh (`/api/v1/customers/auth/<store_slug>/login/`), separate `CustomerTokenAuthentication`, cart merge on login |

---

## 4. Backend — The 24 Django Apps

Each app follows the same shape: `models.py`, `serializers.py`, `views.py`, `urls.py` (DRF DefaultRouter), `admin.py`, `signals.py`, `tasks.py` (Celery), `services.py`, `migrations/`.

| App | Purpose |
|---|---|
| **core** | Abstract `UUIDModel`/`TimeStampedModel` bases, tenant managers, `TenantMiddleware`, RBAC permissions, `StandardPagination` (25), custom exception handler, audit-log mixin |
| **authentication** | Custom `User` (email login, UUID PK), register/verify/reset, 2FA, org switch, Fernet token crypto, throttled endpoints |
| **organizations** | Multi-tenant root: `Organization`, `Role`/`Permission`/`RolePermission`, `OrganizationMembership` (invite/accept/join flows) |
| **stores** | `Store` (slug subdomain `{slug}.{STORE_DOMAIN}` or custom domain, JSON settings/navigation/footer/translations, SEO/OG fields) + `StoreDomain` verification; store-creation wizard endpoints |
| **products** | `Product` + variants, options, images (≤10), SEO, inventory; `Category`, `Collection`, `InventoryMovement`; CSV import/export; `seed_store_data` command |
| **orders** | `Cart`/`CartItem` (add/update/remove/checkout), `Order` with explicit **status state machine** (pending→confirmed→processing→shipped→delivered / cancelled / refunded) + `OrderStatusHistory`; bulk actions, CSV export, ship/deliver/cancel/timeline/notes |
| **commerce** | The pricing engine: `Discount` (percentage/fixed/free-shipping, usage + per-customer limits, product scoping), `TaxRate` (inclusive/exclusive, country/state/postal specificity), `ShippingZone`/`ShippingRate`, `Refund` (proportional restocking); shared `build_quote` + `create_order_from_quote` used by dashboard *and* storefront checkout |
| **payments** | `Payment` (COD / bank transfer / Stripe card); creates Stripe Checkout Sessions, verifies + processes signed webhooks, idempotent `mark_order_paid`; public `checkout_config` endpoint |
| **webhooks** | Merchant outbound webhooks: `WebhookEndpoint` (event subscriptions) + `WebhookDelivery`; **HMAC-SHA256 signing** (`X-Tujjar-Signature`), Celery delivery with 3 retries |
| **customers** | Storefront shoppers: `Customer` (loyalty points, stats), `Address`, `WishlistItem`, `Review`, `LoyaltyTransaction`, `SavedCart`; separate per-store JWT auth for shoppers |
| **pages** | Page builder backend: `Page` (JSON `content_schema` sections + per-locale translations + SEO/OG) and `PageVersion` snapshots; `section_registry.py` defines ~17 section types |
| **themes** | Theme engine: `Theme` (JSON colors/typography/spacing/dark-mode), `ThemePreset`, `ThemeVersion`, **parent-theme inheritance via deep merge**; system + per-org themes; `seed_themes` |
| **templates** | Full store templates: `Template` (theme + pages + navigation + footer + demo content), `TemplateVersion`, `StoreBackup`; ships bilingual EN/AR seed templates; `seed_templates` |
| **media** | `MediaFolder` (nested) + `MediaAsset` (upload/move/stats), backed by MinIO/S3 in production |
| **search** | Unified `SearchIndex` (Postgres full-text `SearchVectorField`, entity-type boost weights) covering product/page/collection/category/customer/blog_post; `SearchQuery` analytics log; signal- + Celery-maintained |
| **analytics** | `Event` tracking (page_view, product_view, add_to_cart, purchase, search, signup, newsletter_subscribe, click, custom) + `DailyStats` rollups; dashboard summary endpoint (30/60-day deltas, top products, traffic sources) |
| **notifications** | In-app `Notification` (order/product/store/billing/system/AI types, action URLs, read state) + `NotificationPreference`; Celery transactional emails |
| **billing** | SaaS subscriptions: `Plan` (limits: max products/orders/storage/ai_generations, trial days), `Subscription` (trialing/active/past_due/canceled), `Invoice`, `PaymentMethod`; `check_plan_limits` enforcement; Stripe checkout wiring; trial-expiry checks |
| **ai** | `AIProvider` per org (**OpenAI, Anthropic, Gemini, Groq, Ollama, OpenRouter** — keys Fernet-encrypted at rest), `AIConversation`/`AIMessage` chat assistant with store context, `AIGenerationLog`; services: chat, product ideas, sentiment, content generation (descriptions, titles, SEO copy, blog posts) |
| **audit** | Immutable `AuditLog` (action, resource, old/new values, IP, user-agent) written automatically from tenant viewsets; admin query endpoint |
| **platform** | Platform-admin surface (staff/superuser): users, organizations, stores, plans, `SystemConfig`, platform dashboard stats |
| **marketplace** | Theme/template marketplace: `MarketplaceListing` (draft→pending→approved review flow, free/paid), `MarketplaceReview`, `MarketplaceOrder` (purchase/install) |
| **storefront** | **Public, unauthenticated** store rendering API: home/products/categories/collections/pages, robots.txt + sitemap.xml per store, blog (list/post/categories/subscribe/RSS), checkout quote + place order; Redis caching (5-min TTL) with cross-app invalidation |
| **blog** | Full CMS: `BlogPost` (scheduled publish/expire), categories, tags, authors, comments, subscribers, settings; Celery-scheduled publishing |

**Data model:** ~76 model classes (74 concrete + 2 abstract bases). UUID primary keys everywhere; heavy use of JSON fields for settings, translations (EN/AR), theme configs, and page sections; polymorphic `entity_type`/`entity_id` patterns for `SearchIndex`, `Notification`, `Review`.

---

## 5. API Structure

- Single versioned namespace: **`/api/v1/`** — one top-level path per app (`auth/`, `organizations/`, `stores/`, `products/`, `orders/`, `commerce/`, `payments/`, `webhooks/`, `customers/`, `pages/`, `themes/`, `media/`, `search/`, `analytics/`, `notifications/`, `billing/`, `ai/`, `platform/`, `marketplace/`, `templates/`, `audit/`, `store/` (storefront), `blog/`), plus `/api/v1/health/` (DB + cache check) and `/admin/`.
- 75+ REST endpoints; DRF DefaultRouter CRUD + nested `path()` routes for sub-resources (e.g. `products/<uuid>/variants/…`, `stores/<uuid>/domains/<uuid>/verify/`, public `store/<subdomain>/…`).
- Defaults: `JWTAuthentication` + `IsAuthenticated`; public surface limited to storefront, checkout config, and the Stripe webhook.
- Throttling: anon 500/h, user 5000/h (production tightens to 100/h / 1000/h), plus django-ratelimit on sensitive endpoints.

### Sample endpoints

| Area | Endpoint | Purpose |
|---|---|---|
| Auth | `POST /api/v1/auth/login/` · `/register/` · `/refresh/` · `/switch-org/` | JWT lifecycle |
| Products | `GET/POST /api/v1/products/` · `/products/{id}/variants/` | Catalog |
| Orders | `GET/POST /api/v1/orders/` · `/orders/{id}/ship/` | Order ops |
| Pages | `POST /api/v1/pages/{id}/publish/` · `/pages/{id}/versions/` | Builder publishing |
| AI | `POST /api/v1/ai/generate/` · `/ai/generate-product/` · `/ai/chat/{id}/message/` | AI features |
| Storefront | `GET /api/v1/store/{subdomain}/products/` · `/{subdomain}/sitemap.xml` | Public store |
| Payments | `POST /api/v1/payments/stripe/webhook/` | Signed Stripe events |

Full interactive docs: **Swagger at `/api/docs/`**, ReDoc at `/api/redoc/`, OpenAPI JSON at `/api/schema/` (DEBUG builds).

---

## 6. Background Jobs (Celery)

Beat scheduler = database-backed; worker concurrency 2; tasks routed to a `default` queue (300 s hard / 240 s soft time limits).

| Task | App | What it does |
|---|---|---|
| `aggregate_daily_stats`, `aggregate_recent_stats` | analytics | Daily/rolling stats rollups |
| Index updaters (product/category/page/blog) | search, blog | Keep `SearchIndex` fresh |
| `publish_scheduled_posts`, `expire_posts` | blog | Scheduled CMS publishing |
| `send_order_confirmation_email`, `send_notification_email_task` | notifications | Transactional email |
| `check_trial_expiry` | billing | Trial lifecycle enforcement |
| `deliver_webhook` | webhooks | Signed webhook fan-out, 3 retries w/ backoff |

**Outbound webhook events:** `order.created`, `order.paid`, `order.status_changed`, `order.refunded`, `product.created`, `product.updated`, `review.created`. Dispatch is best-effort and never blocks commerce flows.

---

## 7. Caching, Search & Performance

- **Redis cache** (locmem in dev): tenant-org active check (60 s), storefront payloads (300 s TTL) with explicit invalidation helpers (`invalidate_store`, `invalidate_store_seo`, `invalidate_stores_for_theme` walking theme inheritance, `invalidate_org_stores`) triggered from signals across stores/themes/products/pages/blog. Sessions are cache-backed.
- **Search:** Postgres full-text over the unified `SearchIndex` with trigram similarity support, boost weights per entity type; every query and clicked result is logged in `SearchQuery` for analytics.
- **Frontend caching:** Next.js ISR (`revalidate: 300`) with granular cache tags (`store:{slug}`, `store:{slug}:products`, …), plus a root `sitemap.ts` (revalidate 900) and per-store robots/sitemap rewrites.

---

## 8. Frontend — Route Map

All routes live under `src/app/[locale]/` (locale-prefixed, `dir=rtl` for Arabic set on `<html>`).

| Route group | Contents |
|---|---|
| `/` | Marketing landing page (client) |
| `(auth)` | login, register, reset-password, verify-email |
| `(dashboard)` | Merchant dashboard behind a client auth guard: dashboard home, **products** (+detail, attributes, categories, collections, inventory), **orders** (+detail), **customers** (+detail), **discounts, taxes, shipping, refunds**, **pages** (+ page builder), **themes, templates, media, blog** (+editor), **ai, analytics, marketplace, billing, notifications, reviews, webhooks, audit, team, stores** (+domains), **settings**; loading skeletons throughout |
| `admin` | Platform admin: organizations, stores, users, plans, settings |
| `shop/[slug]` | **The multi-tenant storefront** (SSR): home, shop listing + product detail, cart, checkout (+success), collections, blog (+post), CMS-built `[pageSlug]` pages, account, login/register |
| root | `sitemap.ts` (all stores, products, blog), `robots.ts` |

Dashboard chrome: collapsible grouped `Sidebar` (main / catalog / sales / design / engagement / business), `VerificationBanner`, `NotificationsBell`, org switcher, locale switcher.

---

## 9. The Page Builder (`src/builder`)

A full Shopify-style section editor with **three modes** persisted in localStorage: *light* (compact card list), *dnd* (full canvas), *section*.

- **State:** `PageBuilderProvider` — page object, sections from `content_schema`, single/multi selection, dirty tracking, preview mode, **per-locale editing** (saves `content_schema` for EN or `translations[locale].content_schema`), per-page theme override, device preview (desktop/tablet/mobile).
- **History:** classic past/present/future undo/redo stacks (`use-history.ts`); autosave debounced 5 s (`use-auto-save.ts`).
- **Shortcuts:** Ctrl+Z / Ctrl+Shift+Z / Ctrl+S / Ctrl+C / Ctrl+V / Ctrl+D / Delete / Escape / arrows — input-focus aware.
- **DnD:** dnd-kit sortable sections, palette, drop zones, drag overlay, snap guides; duplicate = JSON deep-clone + fresh UUIDs.
- **Inline editing:** contentEditable with a floating `selectionchange`-positioned toolbar.
- **Inspector:** Content/Style/Advanced tabs generated from each section's declarative `settingsSchema` (text, textarea, number, select, color, image, toggle, repeater); integrates the media picker.
- **One registry, two consumers:** `src/builder/sections/registry.ts` defines **16 section types** (hero, product-grid, gallery, testimonials, faq, rich-text, banner, newsletter, custom-html, countdown, video, image, pricing, contact, carousel, footer — some with limits, e.g. max 1 hero) with defaults + presets; `src/lib/section-registry.ts` maps type → React component. **The same components render the builder canvas and the live storefront.**
- **Versioning:** backend `PageVersion` snapshots surfaced in a Version History UI; publish workflow.

---

## 10. Storefront & Theming

- **Theming engine (`src/lib/theme-css.ts`):** converts a `ThemeConfig` (colors incl. dark variants, typography, spacing, radius, animations, darkMode) into CSS variables; emits a **single server-rendered `<style>` tag** covering light + dark with no client DOM mutation (no FOUC). Page-level theme overrides merge over the store base theme.
- **Color system (`src/lib/color-palette.ts`):** generates a full Tailwind-style 50–900 shade scale from a single hex via HSL interpolation.
- **Store layout:** injects theme CSS + custom CSS, resolves Google Fonts, runs a blocking dark-mode init script (localStorage `tujjar-dark-mode`), and generates rich metadata — SEO title templates, canonical + **hreflang en/ar alternates**, OG/Twitter cards, favicons.
- **Rendering model:** storefront pages are async Server Components fetching through a `server-only` layer (`src/lib/server/storefront-api.ts`) that calls Django directly with Next cache tags; interactive parts (header/footer chrome, purchase panel, reviews, cart, checkout) are client islands. `searchParams`-driven SSR listing with whitelisted sorts; JSON-LD `Product` schema on product pages.
- **Multi-store addressing:** path-based `/{locale}/shop/{slug}/**` plus **subdomain hosting** via `src/proxy.ts` (Next 16 middleware): rewrites `sub.example.com/foo` → `/en/shop/sub/foo`, detects locale from cookie/accept-language, and passes through `/robots.txt` + `/sitemap.xml` to the backend.

---

## 11. Feature Domains (frontend ↔ backend)

| Domain | Highlights |
|---|---|
| **Products** | Form + list, category tree, collections, inventory manager, SERP preview, global options, CSV import/export |
| **Orders** | List + timeline, status state machine, bulk actions, fulfillment (ship/deliver/cancel), CSV export |
| **Commerce** | Discounts, tax rates, shipping zones/rates, refunds dashboards; shared checkout quote engine |
| **Payments** | Stripe Checkout + signed webhook, COD, bank transfer; `checkout_config` drives the storefront checkout |
| **Customers** | Storefront accounts per store, addresses, wishlist, reviews, loyalty points, saved carts; cart merge on login |
| **AI** | Provider config UI (6 providers), chat assistant, product generator, content generation, blog AI (generate/improve posts) |
| **Analytics** | Summary + revenue charts, realtime stats polled every 30 s, top products, traffic sources |
| **Blog** | Tiptap 3 editor suite, categories/tags/authors/comments/subscribers/settings, scheduling, autosave, AI assist |
| **Themes & Templates** | Color/typography/spacing/radius/animations/dark-mode editors, versions + rollback, import/export/duplicate/install; template pages/nav/footer editors; 4-step store-creation wizard |
| **Marketplace** | Browse + install themes and templates, previews, store selector, reviews |
| **Billing** | Plans with quotas, subscription lifecycle, Stripe checkout, invoices, payment methods |
| **Media** | Gallery + folders, upload, picker modal reused by builder and forms |
| **Notifications** | Bell + panel, unread count, preferences |
| **Webhooks & Audit** | Webhook endpoint management; audit log viewer |
| **Team & Permissions** | Members, roles, `useHasPermission` gating with owner bypass |

---

## 12. i18n

- Locales: **`en`** (default) and **`ar`** — identical namespace trees in `messages/en.json` / `messages/ar.json`.
- Full **RTL**: `<html dir="rtl">` for Arabic, logical Tailwind utilities (`ms-*`, `me-*`, `border-e`, `text-start`) throughout.
- Namespaces cover metadata, common, landing, auth, dashboard (~30 sub-namespaces), admin, storeSettings, storefront.
- **Content-level translations** for pages/products/stores; the builder edits per-locale page schemas.
- Localized navigation via next-intl (`src/i18n.ts` re-exports `Link`/`useRouter`/etc.).

---

## 13. Security Posture

- JWT with short-lived access tokens, refresh rotation + blacklist; `org_id` claim drives tenancy.
- 2FA (TOTP + backup codes); password reset/verification tokens stored as SHA-256 hashes; 2FA secrets and AI provider keys **Fernet-encrypted at rest**.
- RBAC enforced fail-closed at the ViewSet layer; automatic immutable audit logging of mutating actions.
- Stripe webhooks signature-verified; outbound webhooks HMAC-signed.
- Next.js security headers (X-Frame-Options DENY, HSTS in prod), DOMPurify sanitization of rich HTML, production settings add HSTS/SSL-redirect and `ManifestStaticFilesStorage`.
- Login/verification throttling + django-ratelimit.

---

## 14. Deployment

### Dev stack (`docker-compose.yml` — 7 services)

| Service | Image / build | Notes |
|---|---|---|
| nginx | nginx:alpine | Reverse proxy on **:9080**, serves static + media |
| backend | backend Dockerfile | `migrate` then **gunicorn + gevent** (2 workers, 500 connections each) |
| frontend | frontend Dockerfile | Next standalone server on :3000 |
| db | pgvector/pgvector:pg16 | Custom `postgresql.conf`, healthcheck |
| redis | redis:7-alpine | Cache + broker, healthcheck |
| celery-worker | backend image | concurrency 2 |
| celery-beat | backend image | DatabaseScheduler |

Volumes: `pgdata`, `redis_data`, `media_data`. JSON-file log rotation (10 MB × 3).

### Production
`docker-compose.prod.yml` + a production Django settings module (HSTS, SSL redirect, S3 storage via django-storages, stricter throttles) and multi-stage Dockerfiles (backend gunicorn; frontend node:22-alpine standalone).

### Ports & URLs (dev)
Frontend `http://localhost:3000` · Backend `http://localhost:8000` · API docs `http://localhost:8000/api/docs/` · MinIO console `http://localhost:9001` · Nginx `http://localhost:9080` · Default admin: `admin@tujjar.com` / `admin123`.

---

## 15. Development Workflow

```bash
cp .env.example .env          # set DJANGO_SECRET_KEY (+ optional AI/Stripe keys)

# Full stack
docker compose up -d

# Or local dev
make dev                      # infra + backend runserver
cd frontend && pnpm install && pnpm dev

# Seed demo content
python manage.py seed_themes && seed_templates && seed_store_data   # or bootstrap_demo.py

# Quality gates
make test            # backend pytest (35 unit files, fixtures in conftest.py)
make test-cov        # backend coverage (CI gate: ≥80% on apps/)
make frontend-test   # Vitest (8 test files: client, history, clipboard, helpers, stores, utils)
make lint            # ruff check + format check
make typecheck       # mypy --strict on apps/
```

Frontend equivalents: `frontend-lint`, `frontend-typecheck`, `frontend-test-cov`. Docker helpers: `docker-up/down/logs/restart`, `db-shell`, `db-reset`. Seeded demo org: `demo` with a fashion store.

**CI (`.github/workflows/ci.yml`):** on push/PR to `main` with concurrency cancellation → `lint` (ruff, ESLint, tsc) → `test-backend` (pytest, coverage gate ≥80%, Codecov) → `test-fronting` (`pnpm vitest`). Dependabot configured; a `sync-to-production.yml` workflow exists.

---

## 16. Key Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `DJANGO_SECRET_KEY` | **Required** | — |
| `DJANGO_SETTINGS_MODULE` | base/development/production/testing | development |
| `POSTGRES_*` | Database creds | tujjar/tujjar |
| `REDIS_URL`, `CELERY_BROKER_URL` | Cache/broker | redis://redis:6379/{0,1} |
| `STORE_DOMAIN` | Subdomain root | tujjar.com |
| `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` | CORS + links | localhost:3000 |
| `MINIO_*` | S3-compatible storage | minioadmin/minioadmin |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | AI providers (optional; per-org keys also supported) | — |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | Card payments (optional) | — |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STORE_DOMAIN`, `BACKEND_URL` | Frontend wiring + subdomain rewrite | localhost |

Full annotated list in `.env.example`.

---

## 17. Project Status & Known Gaps

Two independent audits are checked into the repo (both dated ~June 2026, **historical**):

- `AUDIT_REPORT.md` — scored the platform ~18–22% Shopify-complete; verdict "not production-ready" at that time; flagged missing checkout/payments/taxes/shipping, weak RBAC enforcement, thin storefront, thin tests.
- `SHOPIFY_COMPETITIVENESS_AUDIT.md` — scored ~40% complete; strong architecture/quality/DX; weak commerce core, SEO, and ops maturity.

**The current code has since closed many of those gaps**, which are now implemented in-tree:

- ✅ Real Stripe Checkout + signed webhooks (`apps/payments`)
- ✅ Discounts, tax rates, shipping zones/rates, refunds (`apps/commerce`)
- ✅ Storefront checkout flow + guest checkout + cart merge
- ✅ Storefront customer accounts, wishlist, reviews, loyalty (`apps/customers`)
- ✅ Outbound merchant webhooks with HMAC signing (`apps/webhooks`)
- ✅ SEO plumbing: metadata templates, OG/Twitter cards, hreflang, JSON-LD, per-store robots/sitemap, root sitemap
- ✅ Search analytics, RBAC-enforced tenant viewsets, audit logging, autosave in the builder

**Remaining areas to watch** (per audits + roadmap):

- Billing is wired to Stripe for checkout, but subscription/invoice reconciliation with Stripe is still partial; refunds don't call the gateway.
- Production ops maturity: monitoring, error tracking, backups/DR.
- Fraud detection, abandoned-cart recovery, multi-currency, faceted search/autocomplete UI.
- Frontend test coverage is still modest (8 unit files; no E2E).
- README roadmap items: email templates, advanced RBAC, plugin marketplace maturity, React Native app.

---

## 18. Glossary

| Term | Meaning |
|---|---|
| **Organization** | The tenant. Owns users (via memberships + roles), stores, and billing. |
| **Store** | A storefront within an organization; slug-based subdomain and/or custom domains; has one theme. |
| **Theme / Preset / Version** | JSON config for colors/typography/etc.; presets are variants; versions enable rollback; themes can inherit a parent. |
| **Template** | A complete store starter (theme + pages + nav + footer + demo content). |
| **Page / PageVersion** | Builder document (JSON sections) and its immutable snapshots. |
| **Section** | One building block of a page (16 types) — same component renders builder preview and storefront. |
| **Quote** | Commerce pricing computation (items + discount + tax + shipping) shared by dashboard and storefront checkout. |
| **Customer** | A storefront shopper, scoped to one store (distinct from platform users). |
| **Platform admin** | Django staff/superuser managing the whole instance via `/admin` routes. |

---

*Generated Nov 2026 from the codebase (backend `apps/`, frontend `src/`, configs, and repo docs). If the code changes, re-run an exploration and update this file.*
