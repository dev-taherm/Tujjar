from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import WebhookDelivery, WebhookEndpoint
from .serializers import (
    WebhookDeliverySerializer,
    WebhookEndpointSerializer,
    rotate_secret,
)
from .services import dispatch_event


class WebhookEndpointViewSet(viewsets.ModelViewSet):
    """Merchant webhook endpoint management (dashboard)."""

    serializer_class = WebhookEndpointSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WebhookEndpoint.unscoped.filter(organization_id=self.request.org_id)

    def perform_create(self, serializer):
        if not self.request.org_id:
            raise ValidationError({"detail": "Organization context required."})
        serializer.save(organization_id=self.request.org_id)

    @action(detail=True, methods=["post"], url_path="rotate-secret")
    def rotate_secret(self, request, pk=None):
        endpoint = self.get_object()
        rotate_secret(endpoint)
        return Response(WebhookEndpointSerializer(endpoint).data)

    @action(detail=True, methods=["post"], url_path="test")
    def test(self, request, pk=None):
        """Send a test event to this endpoint."""
        endpoint = self.get_object()
        queued = dispatch_event(
            request.org_id,
            "order.created",
            {"test": True, "endpoint": str(endpoint.id), "message": "This is a test event."},
        )
        return Response({"queued": queued}, status=status.HTTP_200_OK)


class WebhookDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """Delivery log (dashboard, read-only)."""

    serializer_class = WebhookDeliverySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = WebhookDelivery.unscoped.filter(organization_id=self.request.org_id)
        endpoint_id = self.request.query_params.get("endpoint")
        if endpoint_id:
            qs = qs.filter(endpoint_id=endpoint_id)
        event_type = self.request.query_params.get("event_type")
        if event_type:
            qs = qs.filter(event_type=event_type)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs
