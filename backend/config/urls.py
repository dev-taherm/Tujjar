from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def health_check(request):
    return JsonResponse({"status": "ok"})


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
    path("api/v1/store/", include("apps.storefront.urls")),
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
