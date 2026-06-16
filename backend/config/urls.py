from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def health_check(request):
    import time
    start = time.time()
    health = {"status": "ok", "checks": {}}

    # Check database
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health["checks"]["database"] = "ok"
    except Exception as e:
        health["status"] = "degraded"
        health["checks"]["database"] = f"error: {str(e)}"

    # Check cache
    try:
        from django.core.cache import cache
        cache.set("_health_check", "ok", timeout=5)
        val = cache.get("_health_check")
        health["checks"]["cache"] = "ok" if val == "ok" else "error"
    except Exception as e:
        health["status"] = "degraded"
        health["checks"]["cache"] = f"error: {str(e)}"

    health["response_time_ms"] = round((time.time() - start) * 1000, 2)

    from django.http import JsonResponse
    status_code = 200 if health["status"] == "ok" else 503
    return JsonResponse(health, status=status_code)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="health-check"),
    # API v1
    path("api/v1/auth/", include("apps.authentication.urls")),
    path("api/v1/organizations/", include("apps.organizations.urls")),
    path("api/v1/stores/", include("apps.stores.urls")),
    path("api/v1/products/", include("apps.products.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/customers/", include("apps.customers.urls")),
    path("api/v1/pages/", include("apps.pages.urls")),
    path("api/v1/themes/", include("apps.themes.urls")),
    path("api/v1/media/", include("apps.media.urls")),
    path("api/v1/search/", include("apps.search.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/billing/", include("apps.billing.urls")),
    path("api/v1/ai/", include("apps.ai.urls")),
    path("api/v1/platform/", include("apps.platform.urls")),
    path("api/v1/marketplace/", include("apps.marketplace.urls")),
    path("api/v1/templates/", include("apps.templates.urls")),
    path("api/v1/audit/", include("apps.audit.urls")),
    path("api/v1/store/", include("apps.storefront.urls")),
    path("api/v1/blog/", include("apps.blog.urls")),
]

# API documentation — only available in debug mode (not in production)
if settings.DEBUG:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/docs/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
        path(
            "api/redoc/",
            SpectacularRedocView.as_view(url_name="schema"),
            name="redoc",
        ),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
