from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AddressViewSet,
    CustomerViewSet,
    LoyaltyTransactionViewSet,
    ReviewViewSet,
    SavedCartViewSet,
    WishlistItemViewSet,
)

app_name = "customers"

router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("addresses", AddressViewSet, basename="address")
router.register("wishlist", WishlistItemViewSet, basename="wishlist")
router.register("reviews", ReviewViewSet, basename="review")
router.register("loyalty-transactions", LoyaltyTransactionViewSet, basename="loyalty-transaction")
router.register("saved-carts", SavedCartViewSet, basename="saved-cart")

urlpatterns = [
    path("", include(router.urls)),
]
