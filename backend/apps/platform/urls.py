from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.platform.views import (
    PlatformOrganizationViewSet,
    PlatformPlanViewSet,
    PlatformStoreViewSet,
    PlatformSystemConfigViewSet,
    PlatformUserViewSet,
    platform_dashboard,
)

app_name = "platform"

router = DefaultRouter()
router.register(r"users", PlatformUserViewSet, basename="platform-users")
router.register(r"organizations", PlatformOrganizationViewSet, basename="platform-organizations")
router.register(r"stores", PlatformStoreViewSet, basename="platform-stores")
router.register(r"plans", PlatformPlanViewSet, basename="platform-plans")
router.register(r"config", PlatformSystemConfigViewSet, basename="platform-config")

urlpatterns = [
    path("dashboard/", platform_dashboard, name="platform-dashboard"),
    path("", include(router.urls)),
]
