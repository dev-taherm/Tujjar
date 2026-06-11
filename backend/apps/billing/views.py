from __future__ import annotations

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.billing.models import Plan, Subscription, Invoice, PaymentMethod
from apps.billing.serializers import (
    PlanSerializer,
    SubscriptionSerializer,
    InvoiceSerializer,
    PaymentMethodSerializer,
    CreateCheckoutSessionSerializer,
    CreatePortalSessionSerializer,
)
from apps.core.managers import TenantManager


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer

    def get_queryset(self):
        return Plan.objects.filter(is_active=True)


class SubscriptionViewSet(TenantManager, viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        org = getattr(self.request, "organization", None)
        return Subscription.objects.filter(organization=org)

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # In production: integrate with Stripe/payment provider
        plan = Plan.objects.get(slug=serializer.validated_data["plan_slug"])
        org = getattr(request, "organization", None)
        sub, _ = Subscription.objects.get_or_create(
            organization=org,
            defaults={"plan": plan, "status": Subscription.Status.TRIALING},
        )
        return Response({
            "checkout_url": serializer.validated_data["success_url"],
            "subscription_id": str(sub.id),
        })

    @action(detail=False, methods=["post"])
    def cancel(self, request):
        org = getattr(request, "organization", None)
        sub = Subscription.objects.filter(organization=org, status__in=[Subscription.Status.ACTIVE, Subscription.Status.TRIALING]).first()
        if not sub:
            return Response({"error": "No active subscription"}, status=400)
        sub.status = Subscription.Status.CANCELED
        sub.save(update_fields=["status"])
        return Response({"status": "canceled"})


class InvoiceViewSet(TenantManager, viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        org = getattr(self.request, "organization", None)
        return Invoice.objects.filter(organization=org)


class PaymentMethodViewSet(TenantManager, viewsets.ModelViewSet):
    serializer_class = PaymentMethodSerializer

    def get_queryset(self):
        org = getattr(self.request, "organization", None)
        return PaymentMethod.objects.filter(organization=org)

    @action(detail=True, methods=["post"])
    def set_default(self, request, pk=None):
        pm = self.get_object()
        PaymentMethod.objects.filter(organization=pm.organization, is_default=True).update(is_default=False)
        pm.is_default = True
        pm.save(update_fields=["is_default"])
        return Response({"status": "ok"})
