from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .auth_views import (
    CustomerCartActionsView,
    CustomerCartView,
    CustomerLoginView,
    CustomerLogoutView,
    CustomerMergeCartView,
    CustomerMeView,
    CustomerRegisterView,
    CustomerTokenRefreshView,
)
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
    # Storefront customer auth (public)
    path(
        "auth/<str:store_slug>/register/", CustomerRegisterView.as_view(), name="customer-register"
    ),
    path("auth/<str:store_slug>/login/", CustomerLoginView.as_view(), name="customer-login"),
    path("auth/me/", CustomerMeView.as_view(), name="customer-me"),
    path("auth/token/refresh/", CustomerTokenRefreshView.as_view(), name="customer-token-refresh"),
    path("auth/logout/", CustomerLogoutView.as_view(), name="customer-logout"),
    path("auth/merge-cart/", CustomerMergeCartView.as_view(), name="customer-merge-cart"),
    path("cart/", CustomerCartView.as_view(), name="customer-cart"),
    path("cart/<uuid:cart_id>/<str:action>/", CustomerCartActionsView.as_view(), name="customer-cart-actions"),
]
