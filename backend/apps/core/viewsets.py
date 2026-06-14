from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets

from .permissions import HasOrganizationPermission


class TenantViewSet(viewsets.ModelViewSet):
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


class TenantReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    """Base read-only ViewSet with tenant isolation.

    For ViewSets that should only support list/retrieve (no create/update/delete).
    Any authenticated org member can read.
    """

    permission_classes = [IsAuthenticated]
