from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CartViewSet, OrderViewSet

app_name = "orders"

router = DefaultRouter()
router.register("carts", CartViewSet, basename="cart")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("", include(router.urls)),
]
