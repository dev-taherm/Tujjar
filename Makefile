.PHONY: install dev test migrate shell lint typecheck clean docker-up docker-down

# Backend
install:
	cd backend && pip install -e ".[dev]"

dev:
	docker compose up -d db redis minio
	cd backend && python manage.py migrate
	cd backend && python manage.py runserver 0.0.0.0:8000

test:
	cd backend && pytest -v

test-cov:
	cd backend && pytest --cov=apps --cov-report=html --cov-report=term-missing

migrate:
	cd backend && python manage.py makemigrations
	cd backend && python manage.py migrate

shell:
	cd backend && python manage.py shell

createsuperuser:
	cd backend && python manage.py createsuperuser

lint:
	cd backend && ruff check .
	cd backend && ruff format --check .

format:
	cd backend && ruff check --fix .
	cd backend && ruff format .

typecheck:
	cd backend && mypy apps/

# Frontend
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

frontend-typecheck:
	cd frontend && npm run typecheck

# Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-restart:
	docker compose down && docker compose up -d

# Database
db-shell:
	docker compose exec db psql -U tujjar -d tujjar

db-reset:
	docker compose down -v
	docker compose up -d db
	sleep 3
	cd backend && python manage.py migrate

# All
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/.coverage backend/htmlcov backend/coverage.xml
	rm -rf frontend/.next frontend/out
