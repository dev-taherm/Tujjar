from .base import *  # noqa: F401, F403

DEBUG = False

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default="True", cast=bool)  # noqa: F405
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CSRF Trusted Origins (required for cross-origin POST requests like admin login)
CSRF_TRUSTED_ORIGINS: list[str] = config(
    "CSRF_TRUSTED_ORIGINS",
    default="http://localhost:3000",
    cast=Csv(),
)

# Enforce explicit ALLOWED_HOSTS — never allow wildcard in production
_allowed_hosts = config(
    "DJANGO_ALLOWED_HOSTS", default="*", cast=lambda v: [s.strip() for s in v.split(",")]
)
if "*" in _allowed_hosts:
    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS must not contain '*' in production. "
        "Set the DJANGO_ALLOWED_HOSTS environment variable to your domain(s)."
    )
ALLOWED_HOSTS = _allowed_hosts

# Stricter rate limits for production
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["anon"] = "100/hour"  # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["user"] = "1000/hour"  # noqa: F405

# Use S3 storage in production
STORAGES["default"]["BACKEND"] = "storages.backends.s3boto3.S3Boto3Storage"  # noqa: F405

# Manifest static files for cache-busting
STORAGES["staticfiles"]["BACKEND"] = "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"  # noqa: F405

# Database connection pooling
DATABASES["default"]["CONN_MAX_AGE"] = 600  # noqa: F405

# Production cache (Redis)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,  # noqa: F405
    }
}

LOGGING["loggers"]["apps"]["level"] = "WARNING"  # noqa: F405
