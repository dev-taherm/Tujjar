from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.notifications.views import NotificationPreferenceViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"preferences", NotificationPreferenceViewSet, basename="notification-preference")

app_name = "notifications"

urlpatterns = [
    path("", include(router.urls)),
]
