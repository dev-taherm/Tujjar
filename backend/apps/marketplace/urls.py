from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.marketplace.views import MarketplaceListingViewSet, MyListingsViewSet

router = DefaultRouter()
router.register(r"listings", MarketplaceListingViewSet, basename="marketplace-listing")
router.register(r"my-listings", MyListingsViewSet, basename="my-listings")

app_name = "marketplace"

urlpatterns = [
    path("", include(router.urls)),
]
