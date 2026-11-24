from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.commerce.services import create_refund

from .models import Discount, Refund, ShippingRate, ShippingZone, TaxRate
from .serializers import (
    DiscountSerializer,
    RefundSerializer,
    ShippingRateSerializer,
    ShippingZoneSerializer,
    TaxRateSerializer,
)


class BaseOrgViewSet(viewsets.ModelViewSet):
    """ViewSet creating org-scoped rows from the request's tenant context."""

    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        org_id = self.request.org_id
        if not org_id:
            raise ValidationError({"detail": "You must belong to an organization."})
        serializer.save(organization_id=org_id)


class DiscountViewSet(BaseOrgViewSet):
    queryset = Discount.unscoped.all()
    serializer_class = DiscountSerializer
    filterset_fields = ["is_active", "type"]
    search_fields = ["code", "description"]
    ordering_fields = ["created_at", "code"]


class TaxRateViewSet(BaseOrgViewSet):
    queryset = TaxRate.unscoped.all()
    serializer_class = TaxRateSerializer
    filterset_fields = ["is_active", "country", "is_default", "inclusive"]


class ShippingZoneViewSet(BaseOrgViewSet):
    queryset = ShippingZone.unscoped.all()
    serializer_class = ShippingZoneSerializer
    filterset_fields = ["is_active"]
    search_fields = ["name"]


class ShippingRateViewSet(viewsets.ModelViewSet):
    queryset = ShippingRate.objects.all()
    serializer_class = ShippingRateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["zone", "is_active", "pricing_type"]

    def get_queryset(self):
        qs = super().get_queryset()
        org_id = self.request.org_id
        if org_id:
            qs = qs.filter(zone__organization_id=org_id)
        return qs

    def perform_create(self, serializer):
        org_id = self.request.org_id
        if not org_id:
            raise ValidationError({"detail": "You must belong to an organization."})
        zone = serializer.validated_data["zone"]
        if str(zone.organization_id) != str(org_id):
            raise ValidationError({"detail": "Zone does not belong to your organization."})
        serializer.save()


class RefundViewSet(viewsets.ModelViewSet):
    """Refund management (dashboard).

    Creation triggers the refund service: validates the refundable balance,
    reconciles the order's payment status and optionally restocks items.
    """

    queryset = Refund.unscoped.all()
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["order", "status"]

    def get_queryset(self):
        qs = super().get_queryset()
        org_id = self.request.org_id
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs

    def perform_create(self, serializer):
        order = serializer.validated_data["order"]
        if str(order.organization_id) != str(self.request.org_id):
            raise ValidationError({"detail": "Order does not belong to your organization."})
        try:
            refund = create_refund(
                order,
                amount=serializer.validated_data["amount"],
                reason=serializer.validated_data.get("reason", ""),
                restock=serializer.validated_data.get("restock", False),
                processed_by=self.request.user,
            )
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)})
        serializer.instance = refund

    @action(detail=True, methods=["post"], url_path="fail")
    def fail(self, request, pk=None):
        refund = self.get_object()
        if refund.status != Refund.Status.PENDING:
            return Response(
                {"detail": "Only pending refunds can be marked failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        refund.status = Refund.Status.FAILED
        refund.save(update_fields=["status", "updated_at"])
        return Response(RefundSerializer(refund).data)
