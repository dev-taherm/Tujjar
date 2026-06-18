<p align="center">
  <img src="frontend/public/logo.png" alt="Tujjar" width="120"/>
</p>

<h1 align="center">Tujjar</h1>

<p align="center">
  <em>Connect — Operate — Grow</em>
</p>

<p align="center">
  <strong>The open-source, AI-powered marketplace platform.</strong><br/>
  Build, customize, and scale your own e-commerce store — self-hosted or in the cloud.
</p>

<p align="center">
  <a href="https://github.com/dev-taherm/Tujjar/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"/>
  </a>
  <a href="https://www.python.org/downloads/">
    <img src="https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.10+"/>
  </a>
  <a href="https://www.djangoproject.com/">
    <img src="https://img.shields.io/badge/Django-4.2+-092E20.svg?style=for-the-badge&logo=django&logoColor=white" alt="Django 4.2+"/>
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-16-000000.svg?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16"/>
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5"/>
  </a>
  <a href="https://www.postgresql.org/">
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16"/>
  </a>
  <a href="https://www.docker.com/">
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  </a>
  <a href="https://github.com/dev-taherm/Tujjar/pulls">
    <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome"/>
  </a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-api-reference">API Docs</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="README_AR.md">العربية</a>
</p>

---

## Why Tujjar?

Tujjar is a **complete, self-hosted marketplace platform** built with modern technologies. Unlike SaaS-only solutions, Tujjar gives you **full control** over your data, infrastructure, and customization.

- **Open Source** — MIT licensed. Own your platform, no vendor lock-in.
- **AI-Native** — Built-in AI integration with 6+ providers (OpenAI, Anthropic, Gemini, Groq, Ollama, OpenRouter). Generate product descriptions, get store insights, and chat with AI assistants.
- **Drag-and-Drop Builder** — Visual page builder with 16 section types, undo/redo, and real-time preview. No code required.
- **Multi-Tenant** — Organization-based isolation. Run one instance, serve multiple stores.
- **Self-Hostable** — Docker Compose one-command deployment. Your data stays on your servers.
- **Extensible** — Built with Django + Next.js. Add any feature, integrate any service.

---

## Features

### 🤖 AI Integration
- 6 AI providers: OpenAI, Anthropic, Google Gemini, Groq, Ollama (local), OpenRouter
- AI-powered product description generation
- AI chat assistant for store management
- Content generation (blog posts, marketing copy)
- Multi-provider failover and cost optimization

### 🏪 Store Management
- Multi-store support per organization
- Custom domain mapping
- Store settings (name, description, logo, currency)
- Store status management (active/inactive)

### 📄 Visual Page Builder
- Drag-and-drop section-based editor
- 16 section types (hero, products, features, testimonials, FAQ, etc.)
- Undo/redo history (20+ steps)
- Real-time preview with theme inheritance
- Page versioning and publish workflow
- 8 built-in themes (Minimalist, Modern, Luxury, FreshMarket, TechVolt, StyleHaus, FitForge, Bloom & Co)

### 📦 Product System
- Product variants with custom attributes
- Image galleries (up to 10 images per product)
- Categories and collections
- Inventory tracking
- Product search with full-text indexing
- Product recommendations via AI

### 🛒 Orders & Cart
- Shopping cart with real-time updates
- Checkout flow with address management
- Order history and status tracking
- Customer management
- Guest checkout support

### 📊 Analytics & Search
- Real-time analytics dashboard
- Revenue, orders, and visitor charts
- Daily aggregated statistics
- Full-text search with trigram similarity
- Search analytics and trending queries

### 🔔 Notifications
- In-app notification system
- Notification preferences per user
- Mark read / mark all read
- Real-time unread count
- Notification bell in dashboard header

### 💳 Billing & Subscriptions
- Subscription plans (Free, Basic, Pro, Enterprise)
- Invoice management
- Payment method tracking
- Stripe integration ready
- Usage-based billing support

### 🏬 Marketplace
- Plugin/theme marketplace listings
- User reviews and ratings
- Category browsing and filtering
- Install/uninstall marketplace items
- Developer-friendly extension system

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Django 4.2 + Django REST Framework | REST API, authentication, business logic |
| **Frontend** | Next.js 16 + React 19 + TypeScript | Dashboard UI, storefront, page builder |
| **Database** | PostgreSQL 16 + pgvector | Primary database, vector search for AI |
| **Cache** | Redis 7 | Session cache, Celery broker |
| **Task Queue** | Celery + django-celery-beat | Background jobs, scheduled tasks |
| **Storage** | MinIO / AWS S3 | Media file storage (S3-compatible) |
| **AI** | LiteLLM + LangChain | Multi-provider AI abstraction |
| **UI** | Tailwind CSS 4 + Radix UI | Design system, accessible components |
| **Forms** | React Hook Form + Zod | Form validation, type-safe schemas |
| **State** | Zustand + React Query | Client state, server state management |
| **DnD** | dnd-kit | Drag-and-drop page builder |
| **Auth** | JWT (SimpleJWT) | Token-based authentication |
| **Docs** | drf-spectacular | OpenAPI/Swagger documentation |

---

## Quick Start

### Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/dev-taherm/Tujjar.git
cd Tujjar

# Copy environment file
cp .env.example .env
# Edit .env and set DJANGO_SECRET_KEY

# Start all services
docker compose up -d

# Access the application
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/api/docs/
# MinIO:     http://localhost:9001
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/dev-taherm/Tujjar.git
cd Tujjar

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# Create .env with DJANGO_SECRET_KEY (required)
echo "DJANGO_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')" > .env

# Run migrations and start backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# Frontend setup (new terminal)
cd frontend
pnpm install
pnpm dev
```

### Running Tests

```bash
# Backend tests
make test

# Backend tests with coverage
make test-cov

# Frontend tests
make frontend-test

# Frontend tests with coverage
make frontend-test-cov
```

### Default Credentials

| Account | Email | Password |
|---------|-------|----------|
| **Admin** | admin@tujjar.com | admin123 |

> **Note**: Create a new account at `/register` for regular user access.

---

## Project Structure

```
Tujjar/
├── backend/                    # Django backend
│   ├── apps/                   # 19 modular Django apps
│   │   ├── ai/                 # AI provider management & chat
│   │   ├── analytics/          # Events, dashboard stats
│   │   ├── audit/              # Audit logging
│   │   ├── authentication/     # JWT auth, registration
│   │   ├── billing/            # Plans, subscriptions, invoices
│   │   ├── core/               # Shared utilities
│   │   ├── customers/          # Customer management
│   │   ├── marketplace/        # Plugin marketplace
│   │   ├── media/              # Media library & storage
│   │   ├── notifications/      # Notification system
│   │   ├── orders/             # Orders, cart, checkout
│   │   ├── organizations/      # Multi-tenant organizations
│   │   ├── pages/              # Page builder & versions
│   │   ├── platform/           # Platform admin
│   │   ├── products/           # Products, variants, categories
│   │   ├── search/             # Full-text search
│   │   ├── storefront/         # Public storefront API
│   │   ├── stores/             # Store management
│   │   └── themes/             # Theme system
│   ├── config/                 # Django settings
│   ├── conftest.py             # Pytest fixtures
│   ├── tests/                  # Test suite (71 backend tests)
│   └── pyproject.toml          # Python dependencies
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── api/                # API client & hooks (split by domain)
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/         # Login, Register
│   │   │   ├── (dashboard)/    # Dashboard pages
│   │   │   ├── admin/          # Platform admin dashboard
│   │   │   └── shop/           # Storefront pages
│   │   ├── features/           # Feature modules (20+)
│   │   ├── shared/             # Shared components, types, utils
│   │   └── stores/             # Zustand stores
│   └── package.json            # Frontend dependencies
├── docker/                     # Docker configurations
├── docker-compose.yml          # Development Docker Compose
├── docker-compose.prod.yml     # Production Docker Compose
├── Makefile                    # Development commands
└── .env.example                # Environment variables template
```

---

## API Reference

Tujjar provides **75+ REST API endpoints** with auto-generated OpenAPI documentation.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login/` | Login with email/password |
| POST | `/api/v1/auth/register/` | Create new account |
| POST | `/api/v1/auth/refresh/` | Refresh JWT token |
| GET | `/api/v1/auth/profile/` | Get current user profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products/` | List products |
| POST | `/api/v1/products/` | Create product |
| GET | `/api/v1/products/{id}/` | Get product detail |
| GET | `/api/v1/products/{id}/variants/` | List variants |
| GET | `/api/v1/products/{id}/images/` | List images |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders/` | List orders |
| POST | `/api/v1/orders/` | Create order |
| GET | `/api/v1/orders/{id}/` | Get order detail |

### Pages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/pages/` | List pages |
| POST | `/api/v1/pages/` | Create page |
| POST | `/api/v1/pages/{id}/publish/` | Publish page |
| GET | `/api/v1/pages/{id}/versions/` | List versions |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai/providers/` | List AI providers |
| POST | `/api/v1/ai/generate/` | Generate content |
| POST | `/api/v1/ai/generate-product/` | Generate product with AI |
| POST | `/api/v1/ai/chat/{id}/message/` | Chat with AI assistant |

> Full API documentation available at `/api/docs/` (Swagger UI) or `/api/schema/` (OpenAPI JSON).

---

## AI Providers

Tujjar supports **6 AI providers** with automatic failover:

| Provider | Model | Use Case | Cost |
|----------|-------|----------|------|
| **OpenAI** | GPT-4o, GPT-4o-mini | Content generation, chat | Pay-per-use |
| **Anthropic** | Claude 3.5 Sonnet | Analysis, long-form content | Pay-per-use |
| **Google Gemini** | Gemini Pro | Multimodal, fast inference | Free tier available |
| **Groq** | LLaMA 3 | Ultra-fast inference | Free tier available |
| **Ollama** | LLaMA, Mistral, etc. | Local, private, free | Free (self-hosted) |
| **OpenRouter** | Multi-model | Aggregator, best price | Pay-per-use |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | (required) |
| `DJANGO_DEBUG` | Debug mode | `True` |
| `DJANGO_SETTINGS_MODULE` | Django settings module | `config.settings.development` |
| `POSTGRES_DB` | Database name | `tujjar` |
| `POSTGRES_USER` | Database user | `tujjar` |
| `POSTGRES_PASSWORD` | Database password | `tujjar` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | Celery broker URL | `redis://redis:6379/1` |
| `STORE_DOMAIN` | Store domain for subdomains | `tujjar.com` |
| `FRONTEND_URL` | Frontend URL for links | `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `MINIO_ENDPOINT` | MinIO endpoint | `http://minio:9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `OPENAI_API_KEY` | OpenAI API key | (optional) |
| `ANTHROPIC_API_KEY` | Anthropic API key | (optional) |
| `GOOGLE_API_KEY` | Google Gemini key | (optional) |
| `GROQ_API_KEY` | Groq API key | (optional) |
| `OPENROUTER_API_KEY` | OpenRouter API key | (optional) |
| `STRIPE_SECRET_KEY` | Stripe secret key | (optional) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | (optional) |

> See `.env.example` for the full list with descriptions.

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/Tujjar.git`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes
5. **Run** tests: `make test`
6. **Run** linter: `make lint`
7. **Commit** your changes: `git commit -m "feat: add amazing feature"`
8. **Push** to your fork: `git push origin feature/amazing-feature`
9. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation if needed
- Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, etc.)

---

## Roadmap

- [ ] Stripe payment processing integration
- [ ] Email notification templates
- [ ] Advanced role-based access control (RBAC)
- [ ] Multi-language support (i18n)
- [ ] Webhook system for third-party integrations
- [ ] Advanced analytics with custom reports
- [ ] Mobile app (React Native)
- [ ] Plugin/extension marketplace

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Django](https://www.djangoproject.com/) — The web framework
- [Next.js](https://nextjs.org/) — The React framework
- [Tailwind CSS](https://tailwindcss.com/) — The utility-first CSS framework
- [LiteLLM](https://github.com/BerriAI/litellm) — Multi-provider AI gateway
- [dnd-kit](https://dndkit.com/) — Drag-and-drop toolkit
- [Radix UI](https://www.radix-ui.com/) — Accessible component primitives

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/dev-taherm">Taher Mahram</a>
</p>

<p align="center">
  If you find Tujjar useful, please give it a ⭐ on GitHub — it helps others discover the project!s
</p>
