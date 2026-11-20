from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "commerce"

router = DefaultRouter()
router.register(r"discounts", views.DiscountViewSet, basename="discount")
router.register(r"taxes", views.TaxRateViewSet, basename="taxrate")
router.register(r"shipping/zones", views.ShippingZoneViewSet, basename="shipping-zone")
router.register(r"shipping/rates", views.ShippingRateViewSet, basename="shipping-rate")
router.register(r"refunds", views.RefundViewSet, basename="refund")

urlpatterns = [
    path("", include(router.urls)),
]
