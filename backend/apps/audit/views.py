from __future__ import annotations

from django.utils.dateparse import parse_datetime
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsPlatformAdmin
from apps.core.viewsets import TenantReadOnlyViewSet

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(TenantReadOnlyViewSet):
    """Read-only audit log viewer scoped to the current organization."""

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AuditLog.objects.filter(organization_id=self.request.org_id)

        action_filter = self.request.query_params.get("action")
        if action_filter:
            qs = qs.filter(action__icontains=action_filter)

        resource_type = self.request.query_params.get("resource_type")
        if resource_type:
            qs = qs.filter(resource_type=resource_type)

        user_id = self.request.query_params.get("user")
        if user_id:
            qs = qs.filter(user_id=user_id)

        date_from = self.request.query_params.get("date_from")
        if date_from:
            dt = parse_datetime(date_from)
            if dt:
                qs = qs.filter(created_at__gte=dt)

        date_to = self.request.query_params.get("date_to")
        if date_to:
            dt = parse_datetime(date_to)
            if dt:
                qs = qs.filter(created_at__lte=dt)

        return qs.select_related("user").order_by("-created_at")
