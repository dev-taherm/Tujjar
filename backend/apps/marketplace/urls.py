from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.marketplace.views import MarketplaceListingViewSet, MyListingsViewSet, MarketplaceOrderViewSet

router = DefaultRouter()
router.register(r"listings", MarketplaceListingViewSet, basename="marketplace-listing")
router.register(r"my-listings", MyListingsViewSet, basename="my-listings")
router.register(r"orders", MarketplaceOrderViewSet, basename="marketplace-order")

app_name = "marketplace"

urlpatterns = [
    path("", include(router.urls)),
]
