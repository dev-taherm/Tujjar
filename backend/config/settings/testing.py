from .base import *  # noqa: F401, F403

DEBUG = False

# Use SQLite for fast tests
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Disable migrations for faster test setup
# class DisableMigrations:
#     def __contains__(self, item: str) -> bool:
#         return True
#     def __getitem__(self, item: str) -> None:
#         return None
# MIGRATION_MODULES = DisableMigrations()

# Password hashers - use fast hasher for tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Use locmem cache for tests
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Disable Celery during tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Use console email in tests
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Disable rate limiting in tests
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {}  # noqa: F405

# Set very high auth throttle rates for tests
AUTH_LOGIN_THROTTLE_RATE = "10000/hour"
AUTH_REGISTER_THROTTLE_RATE = "10000/hour"
AUTH_PASSWORD_RESET_THROTTLE_RATE = "10000/hour"
AUTH_TOTP_THROTTLE_RATE = "10000/hour"
AUTH_ANON_THROTTLE_RATE = "10000/hour"
