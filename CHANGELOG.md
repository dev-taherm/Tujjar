# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-07-01

### Added

#### AI Integration
- 6 AI providers: OpenAI, Anthropic, Google Gemini, Groq, Ollama (local), OpenRouter
- AI-powered product description generation
- AI chat assistant for store management
- Content generation (blog posts, marketing copy)
- Multi-provider failover and cost optimization

#### Store Management
- Multi-store support per organization
- Custom domain mapping
- Store settings (name, description, logo, currency)
- Store status management (active/inactive)

#### Visual Page Builder
- Drag-and-drop section-based editor
- 16 section types (hero, products, features, testimonials, FAQ, pricing, banner, newsletter, contact, video, rich-text, image, countdown, custom-html, carousel, footer)
- Undo/redo history (20+ steps)
- Real-time preview with theme inheritance
- Page versioning and publish workflow
- 8 built-in themes (Minimalist, Modern, Luxury, FreshMarket, TechVolt, StyleHaus, FitForge, Bloom & Co)

#### Product System
- Product variants with custom attributes
- Image galleries (up to 10 images per product)
- Categories and collections
- Inventory tracking
- Product search with full-text indexing
- Product recommendations via AI

#### Orders & Cart
- Shopping cart with real-time updates
- Checkout flow with address management
- Order history and status tracking
- Customer management
- Guest checkout support

#### Analytics & Search
- Real-time analytics dashboard
- Revenue, orders, and visitor charts
- Daily aggregated statistics
- Full-text search with trigram similarity
- Search analytics and trending queries

#### Notifications
- In-app notification system
- Notification preferences per user
- Mark read / mark all read
- Real-time unread count

#### Billing & Subscriptions
- Subscription plans (Free, Basic, Pro, Enterprise)
- Invoice management
- Payment method tracking
- Stripe integration ready

#### Marketplace
- Plugin/theme marketplace listings
- User reviews and ratings
- Category browsing and filtering
- Install/uninstall marketplace items

#### Theme System
- Theme inheritance with deep merge
- Theme presets (Dark, Light, custom variants)
- Theme versioning with rollback
- Theme import/export (.json, .zip)
- Per-page theme overrides

#### Technical
- Django 4.2 + Django REST Framework backend
- Next.js 16 + React 19 + TypeScript frontend
- PostgreSQL 16 with pgvector
- Redis 7 for caching
- Celery + django-celery-beat for background tasks
- MinIO / S3-compatible storage
- JWT authentication
- OpenAPI/Swagger documentation
- Docker Compose deployment
- GitHub Actions CI/CD
- 71+ backend tests
