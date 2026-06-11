from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.billing.views import PlanViewSet, SubscriptionViewSet, InvoiceViewSet, PaymentMethodViewSet

router = DefaultRouter()
router.register(r"plans", PlanViewSet, basename="plan")
router.register(r"subscription", SubscriptionViewSet, basename="subscription")
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"payment-methods", PaymentMethodViewSet, basename="payment-method")

app_name = "billing"

urlpatterns = [
    path("", include(router.urls)),
]
