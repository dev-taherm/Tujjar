from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    """Allow access only to platform admins (is_staff or is_superuser)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )
