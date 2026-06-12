from __future__ import annotations

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsPlatformAdmin(BasePermission):
    """Allow access only to platform admins (is_staff or is_superuser)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )


class HasOrganizationPermission(BasePermission):
    """
    Check if the user has the required permission for the current organization.

    Usage in ViewSet:
        permission_classes = [IsAuthenticated, HasOrganizationPermission]

    The view should set `required_permission` attribute, e.g.:
        required_permission = "products.create"

    If no required_permission is set, only safe methods (GET, HEAD, OPTIONS) are allowed.
    This is a fail-closed design — views must explicitly declare their permission needs.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        required_permission = getattr(view, "required_permission", None)
        if not required_permission:
            # Fail-closed: only allow safe methods when no permission is declared
            return request.method in SAFE_METHODS

        org_id = getattr(request, "org_id", None)
        if not org_id:
            return False

        from apps.organizations.models import OrganizationMembership

        membership = OrganizationMembership.objects.filter(
            user=request.user,
            organization_id=org_id,
            is_accepted=True,
        ).select_related("role").first()

        if not membership:
            return False

        if membership.role.slug == "owner":
            return True

        return membership.role.role_permissions.filter(
            permission__codename=required_permission
        ).exists()
