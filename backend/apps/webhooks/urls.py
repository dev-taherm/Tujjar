from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import WebhookDeliveryViewSet, WebhookEndpointViewSet

app_name = "webhooks"

router = DefaultRouter()
router.register("endpoints", WebhookEndpointViewSet, basename="webhook-endpoint")
router.register("deliveries", WebhookDeliveryViewSet, basename="webhook-delivery")

urlpatterns = [
    path("", include(router.urls)),
]
