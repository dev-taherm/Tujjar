from __future__ import annotations

from typing import Any

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .permissions import HasOrganizationPermission


class AuditLogMixin:
    """Mixin that adds `_log_audit` to any viewset."""

    def _log_audit(
        self,
        action: str,
        resource_type: str,
        resource_id: str,
        *,
        old_value: dict[str, Any] | None = None,
        new_value: dict[str, Any] | None = None,
        organization=None,
    ) -> None:
        """Create an audit log entry, auto-extracting ip_address and user_agent."""
        from apps.audit.models import log_action

        if organization is None:
            from apps.organizations.models import Organization

            organization = Organization.objects.filter(
                id=getattr(self.request, "org_id", None)
            ).first()

        log_action(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            organization=organization,
            user=self.request.user,
            old_value=old_value,
            new_value=new_value,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )


class TenantViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Base ViewSet with tenant isolation and RBAC enforcement.

    Subclasses should set `required_permission` to the appropriate codename
    for write operations (create/update/delete). Read operations (list/retrieve)
    are allowed for any authenticated org member.

    Example:
        class ProductViewSet(TenantViewSet):
            required_permission = "products.create"
    """

    permission_classes = [IsAuthenticated, HasOrganizationPermission]
    required_permission = None

    def get_permissions(self):
        """Allow read operations for any authenticated org member,
        write operations require the specified permission."""
        if self.action in ("list", "retrieve", "metadata", "options"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), HasOrganizationPermission()]


class TenantReadOnlyViewSet(AuditLogMixin, viewsets.ReadOnlyModelViewSet):
    """Base read-only ViewSet with tenant isolation.

    For ViewSets that should only support list/retrieve (no create/update/delete).
    Any authenticated org member can read.
    """

    permission_classes = [IsAuthenticated]
