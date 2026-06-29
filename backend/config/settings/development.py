from .base import *  # noqa: F401, F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

CORS_ALLOW_ALL_ORIGINS = True

# Use console email backend in development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Simplified cache for dev
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Use SQLite for local development (no PostgreSQL setup needed)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Disable Celery in local dev
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Local file storage
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "/media/"

# No password restrictions in local dev
AUTH_PASSWORD_VALIDATORS = []

# Disable email verification in local dev
EMAIL_VERIFICATION_REQUIRED = False

# Store domain for local dev (stores become {slug}.localhost)
STORE_DOMAIN = "localhost"

# Disable rate limiting in local dev
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {}

AUTH_LOGIN_THROTTLE_RATE = "10000/hour"
AUTH_REGISTER_THROTTLE_RATE = "10000/hour"
AUTH_PASSWORD_RESET_THROTTLE_RATE = "10000/hour"
AUTH_TOTP_THROTTLE_RATE = "10000/hour"
AUTH_ANON_THROTTLE_RATE = "10000/hour"
