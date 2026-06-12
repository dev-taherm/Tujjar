FROM python:3.12-slim AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system app && useradd --system --ingroup app app

COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

COPY . .

RUN chown -R app:app /app

EXPOSE 8000

# --- Development ---
FROM base AS development
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# --- Production ---
FROM base AS production
USER app
RUN pip install --no-cache-dir gunicorn gevent
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "gevent", \
     "--worker-connections", "1000", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
