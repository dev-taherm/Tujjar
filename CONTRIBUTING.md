# Contributing to Tujjar

Thank you for your interest in contributing to Tujjar! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Good First Issues](#good-first-issues)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 20 or higher
- **pnpm** 9 or higher
- **Docker** and Docker Compose (recommended)
- **PostgreSQL** 16 (if running locally without Docker)
- **Redis** 7 (if running locally without Docker)

### Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/your-username/Tujjar.git
cd Tujjar
git remote add upstream https://github.com/dev-taherm/Tujjar.git
```

## Development Setup

### Option 1: Docker (Recommended)

```bash
# Copy environment file
cp .env.example .env

# Generate a secret key
python3 -c "import secrets; print(secrets.token_urlsafe(50))"

# Add to .env: DJANGO_SECRET_KEY=<generated-key>

# Start services
docker compose up -d

# Access the app
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/api/docs/
```

### Option 2: Local Development

```bash
# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# Create .env with required keys
echo "DJANGO_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')" > .env

# Run migrations and start backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# Frontend setup (new terminal)
cd frontend
pnpm install
pnpm dev
```

### Default Credentials

| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@tujjar.com | admin123 |

## Making Changes

### Branch Naming

Use descriptive branch names:

```bash
git checkout -b feat/add-payment-integration
git checkout -b fix/cart-calculation-bug
git checkout -b docs/update-api-reference
git checkout -b refactor/clean-theme-system
```

### Workflow

```bash
# Sync with upstream
git fetch upstream
git rebase upstream/main

# Create your branch
git checkout -b feat/your-feature

# Make changes, test, commit
git add .
git commit -m "feat: add payment integration"

# Push to your fork
git push origin feat/your-feature

# Open a Pull Request on GitHub
```

## Testing

### Backend Tests

```bash
# Run all tests
make test

# Run with coverage
make test-cov

# Run specific test file
cd backend && pytest apps/themes/tests/test_models.py -v

# Run specific test
cd backend && pytest -k "test_theme_creation" -v
```

### Frontend Tests

```bash
# Run all tests
make frontend-test

# Run with coverage
make frontend-test-cov

# Run specific test file
cd frontend && pnpm vitest run src/features/themes/theme-card.test.tsx
```

### Before Submitting

Ensure all checks pass:

```bash
# Backend
make lint          # Linting
make test          # Tests

# Frontend
make frontend-lint       # Linting
make frontend-test       # Tests
```

## Code Style

### Python (Backend)

- We use [Ruff](https://docs.astral.sh/ruff/) for linting and formatting
- Follow PEP 8 conventions
- Use type hints where applicable
- Run `make format` before committing

```bash
# Check for issues
make lint

# Auto-fix issues
make format
```

### TypeScript/React (Frontend)

- We use ESLint and Prettier
- Follow the existing code patterns
- Use TypeScript strict mode
- Run `make frontend-lint` before committing

```bash
# Check for issues
make frontend-lint

# Auto-fix issues
cd frontend && pnpm lint --fix
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, no logic change) |
| `refactor` | Code refactoring (no feature change) |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |

### Examples

```
feat(orders): add guest checkout support
fix(themes): correct dark mode color inheritance
docs(api): update authentication endpoints
refactor(products): simplify variant selection logic
test(themes): add theme import/export tests
```

## Pull Request Process

### Before Submitting

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linting passes
- [ ] New features have tests
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow conventions

### PR Description

Include:

1. **What** - Brief description of changes
2. **Why** - Context on why this change is needed
3. **How** - Implementation details (if complex)
4. **Screenshots** - For UI changes

### Review Process

1. Maintainers will review your PR within 72 hours
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR

### After Merge

- Delete your feature branch
- Pull the latest changes
- Celebrate your contribution!

## Reporting Bugs

Use the [Bug Report template](https://github.com/dev-taherm/Tujjar/issues/new?template=bug_report.md) when filing a bug. Include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

## Suggesting Features

Use the [Feature Request template](https://github.com/dev-taherm/Tujjar/issues/new?template=feature_request.md). Include:

- Problem you're trying to solve
- Proposed solution
- Alternatives considered
- Additional context

## Good First Issues

Look for issues labeled:

- [`good first issue`](https://github.com/dev-taherm/Tujjar/labels/good%20first%20issue) - Perfect for newcomers
- [`help wanted`](https://github.com/dev-taherm/Tujjar/labels/help%20wanted) - Community contributions welcome
- [`documentation`](https://github.com/dev-taherm/Tujjar/labels/documentation) - Documentation improvements

These are curated to be approachable for new contributors.

## Questions?

- Open a [Discussion](https://github.com/dev-taherm/Tujjar/discussions)
- Check existing [Issues](https://github.com/dev-taherm/Tujjar/issues) and [Discussions](https://github.com/dev-taherm/Tujjar/discussions)

Thank you for contributing to Tujjar!
