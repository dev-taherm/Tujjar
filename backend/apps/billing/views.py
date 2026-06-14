from __future__ import annotations

import uuid
from decimal import Decimal

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.billing.models import Plan, Subscription, Invoice, PaymentMethod
from apps.billing.serializers import (
    PlanSerializer,
    SubscriptionSerializer,
    InvoiceSerializer,
    PaymentMethodSerializer,
    CreateCheckoutSessionSerializer,
)
from apps.core.viewsets import TenantViewSet


def check_plan_limits(organization, resource_type: str) -> dict:
    """Check if organization has exceeded plan limits. Returns dict with limit info."""
    from apps.products.models import Product
    from apps.orders.models import Order

    try:
        sub = Subscription.objects.select_related("plan").get(organization=organization)
        plan = sub.plan
    except Subscription.DoesNotExist:
        return {"exceeded": False}

    checks = {
        "products": (Product.objects.filter(organization=organization).count(), plan.max_products),
        "orders": (Order.objects.filter(organization=organization).count(), plan.max_orders),
    }
    current, max_val = checks.get(resource_type, (0, 0))
    return {
        "exceeded": current >= max_val,
        "current": current,
        "limit": max_val,
    }


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer

    def get_queryset(self):
        return Plan.objects.filter(is_active=True)


class SubscriptionViewSet(TenantViewSet):
    serializer_class = SubscriptionSerializer
    required_permission = "billing.manage"

    def get_queryset(self):
        org = getattr(self.request, "org_id", None)
        if not org:
            return Subscription.objects.none()
        return Subscription.objects.filter(organization_id=org).select_related("plan")

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = Plan.objects.get(slug=serializer.validated_data["plan_slug"])
        org_id = request.org_id
        sub, created = Subscription.objects.get_or_create(
            organization_id=org_id,
            defaults={
                "plan": plan,
                "status": Subscription.Status.TRIALING,
                "trial_start": timezone.now(),
                "trial_end": timezone.now() + timezone.timedelta(days=plan.trial_days),
                "current_period_start": timezone.now(),
                "current_period_end": timezone.now() + timezone.timedelta(days=30),
            },
        )
        if created:
            Invoice.objects.create(
                organization_id=org_id,
                subscription=sub,
                status=Invoice.Status.DRAFT,
                amount=Decimal("0"),
                currency=plan.currency,
                description=f"Trial: {plan.name}",
                invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
                due_date=timezone.now().date(),
            )
        return Response({
            "checkout_url": serializer.validated_data["success_url"],
            "subscription_id": str(sub.id),
        })

    @action(detail=False, methods=["post"])
    def cancel(self, request):
        org_id = request.org_id
        sub = Subscription.objects.filter(
            organization_id=org_id,
            status__in=[Subscription.Status.ACTIVE, Subscription.Status.TRIALING],
        ).first()
        if not sub:
            return Response({"error": "No active subscription"}, status=400)
        sub.status = Subscription.Status.CANCELED
        sub.canceled_at = timezone.now()
        sub.cancel_at = sub.current_period_end
        sub.save(update_fields=["status", "canceled_at", "cancel_at", "updated_at"])
        return Response({"status": "canceled", "cancel_at": sub.cancel_at})


class InvoiceViewSet(TenantViewSet):
    serializer_class = InvoiceSerializer
    required_permission = "billing.view_invoices"

    def get_queryset(self):
        org = getattr(self.request, "org_id", None)
        if not org:
            return Invoice.objects.none()
        return Invoice.objects.filter(organization_id=org).select_related("subscription")


class PaymentMethodViewSet(TenantViewSet):
    serializer_class = PaymentMethodSerializer
    required_permission = "billing.manage"

    def get_queryset(self):
        org = getattr(self.request, "org_id", None)
        if not org:
            return PaymentMethod.objects.none()
        return PaymentMethod.objects.filter(organization_id=org)

    @action(detail=True, methods=["post"])
    def set_default(self, request, pk=None):
        pm = self.get_object()
        PaymentMethod.objects.filter(organization=pm.organization, is_default=True).update(is_default=False)
        pm.is_default = True
        pm.save(update_fields=["is_default"])
        return Response({"status": "ok"})
