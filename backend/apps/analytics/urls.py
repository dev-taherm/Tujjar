from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.analytics.views import EventViewSet

router = DefaultRouter()
router.register(r"events", EventViewSet, basename="event")

app_name = "analytics"

urlpatterns = [
    path("", include(router.urls)),
]
