from __future__ import annotations

from django.db import models
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.viewsets import AuditLogMixin

from .models import Organization, OrganizationMembership, Permission, Role
from .serializers import (
    InviteMemberSerializer,
    OrganizationMembershipSerializer,
    OrganizationSerializer,
    PermissionSerializer,
    RoleSerializer,
)

# Roles that can manage members
MEMBER_MANAGEMENT_ROLES = {"owner", "admin", "manager"}
# Roles that can manage the organization settings
ORG_MANAGEMENT_ROLES = {"owner", "admin"}


def _check_org_role(user, org_id, allowed_slugs):
    """Raise PermissionDenied if user's role in org is not in allowed_slugs."""
    membership = OrganizationMembership.objects.filter(
        user=user, organization_id=org_id, is_accepted=True
    ).select_related("role").first()
    if not membership:
        raise PermissionDenied("You are not a member of this organization.")
    if membership.role.slug not in allowed_slugs:
        raise PermissionDenied(f"Requires one of: {', '.join(allowed_slugs)}")
    return membership


class OrganizationViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Organization CRUD and management."""

    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Organization.objects.prefetch_related(
            Prefetch(
                "memberships",
                queryset=OrganizationMembership.objects.filter(is_accepted=True).select_related("user", "role"),
            )
        ).filter(
            memberships__user=self.request.user,
            memberships__is_accepted=True,
        ).distinct()

    def perform_create(self, serializer):
        org = serializer.save()
        # Create owner role
        owner_role, _ = Role.objects.get_or_create(
            slug="owner",
            organization=None,
            defaults={"name": "Owner", "is_system": True},
        )
        # Add creator as owner
        OrganizationMembership.objects.create(
            user=self.request.user,
            organization=org,
            role=owner_role,
            is_accepted=True,
            accepted_at=timezone.now(),
        )
        self._log_audit(action="organization.create", resource_type="organization", resource_id=org.id, new_value=serializer.data)

    def update(self, request, *args, **kwargs):
        _check_org_role(request.user, kwargs["pk"], ORG_MANAGEMENT_ROLES)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        _check_org_role(request.user, kwargs["pk"], ORG_MANAGEMENT_ROLES)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        _check_org_role(request.user, kwargs["pk"], {"owner"})
        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):
        old_data = OrganizationSerializer(serializer.instance).data
        org = serializer.save()
        self._log_audit(action="organization.update", resource_type="organization", resource_id=org.id, old_value=old_data, new_value=serializer.data)

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        org = self.get_object()
        memberships = OrganizationMembership.objects.filter(
            organization=org, is_accepted=True
        ).select_related("user", "role").prefetch_related("role__role_permissions__permission")
        serializer = OrganizationMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        _check_org_role(request.user, pk, MEMBER_MANAGEMENT_ROLES)
        org = self.get_object()
        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from django.contrib.auth import get_user_model

        User = get_user_model()
        user = User.objects.get(email=serializer.validated_data["email"])
        role = serializer.role

        membership, created = OrganizationMembership.objects.get_or_create(
            user=user,
            organization=org,
            defaults={"role": role, "is_accepted": False},
        )

        if not created:
            return Response(
                {"detail": "User is already a member or has been invited."},
                status=status.HTTP_409_CONFLICT,
            )

        self._log_audit(action="organization.member.invite", resource_type="organization", resource_id=org.id, new_value={"email": user.email, "role": role.slug})

        # Notify the invited user
        from apps.notifications.models import Notification

        Notification.create_for_user(
            user=user,
            notification_type="system",
            title="Organization Invitation",
            message=f"You've been invited to join {org.name} as {role.name}",
            organization=org,
            entity_type="organization",
            entity_id=org.id,
        )

        # Send invitation email
        try:
            from django.conf import settings
            from django.core.mail import send_mail

            send_mail(
                subject=f"You're invited to join {org.name}",
                message=f"You've been invited to join {org.name} on Tujjar. Log in to accept the invitation.",
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@tujjar.com"),
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response(
            OrganizationMembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="accept-invite")
    def accept_invite(self, request, pk=None):
        membership = OrganizationMembership.objects.filter(
            organization_id=pk,
            user=request.user,
            is_accepted=False,
        ).first()
        if not membership:
            return Response(
                {"detail": "No pending invitation found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        membership.is_accepted = True
        membership.accepted_at = timezone.now()
        membership.save(update_fields=["is_accepted", "accepted_at"])
        return Response({"message": "Invitation accepted"})

    @action(detail=True, methods=["delete"], url_path="remove-member")
    def remove_member(self, request, pk=None):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response(
                {"detail": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Check requesting user has permission to remove members
        caller_membership = _check_org_role(request.user, pk, MEMBER_MANAGEMENT_ROLES)
        membership = OrganizationMembership.objects.filter(
            organization_id=pk, user_id=user_id
        ).first()
        if not membership:
            return Response(
                {"detail": "Member not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if membership.role.slug == "owner":
            return Response(
                {"detail": "Cannot remove the owner."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Managers can only remove staff-level or lower
        if caller_membership.role.slug == "manager" and membership.role.slug not in {"staff", "editor", "customer_support"}:
            return Response(
                {"detail": "Managers can only remove staff, editors, and customer support."},
                status=status.HTTP_403_FORBIDDEN,
            )
        self._log_audit(action="organization.member.remove", resource_type="organization", resource_id=pk, old_value={"user_id": user_id, "role": membership.role.slug})
        membership.delete()
        return Response({"message": "Member removed"})


class RoleViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Role management within an organization."""

    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_id = self.kwargs.get("org_pk")
        return Role.objects.filter(
            models.Q(organization_id=org_id) | models.Q(is_system=True)
        ).distinct()

    def perform_create(self, serializer):
        org_id = self.kwargs.get("org_pk")
        if org_id:
            _check_org_role(self.request.user, org_id, ORG_MANAGEMENT_ROLES)
        org = serializer.save()
        self._log_audit(action="role.create", resource_type="role", resource_id=org.id, new_value=RoleSerializer(org).data if hasattr(org, 'role_permissions') else {"name": org.name})

    def perform_update(self, serializer):
        if serializer.instance and serializer.instance.is_system:
            raise PermissionDenied("System roles cannot be modified.")
        org_id = self.kwargs.get("org_pk")
        if org_id:
            _check_org_role(self.request.user, org_id, ORG_MANAGEMENT_ROLES)
        old_data = RoleSerializer(serializer.instance).data
        role = serializer.save()
        self._log_audit(action="role.update", resource_type="role", resource_id=role.id, old_value=old_data, new_value=RoleSerializer(role).data)

    def perform_destroy(self, instance):
        if instance.is_system:
            raise PermissionDenied("System roles cannot be deleted.")
        org_id = self.kwargs.get("org_pk")
        if org_id:
            _check_org_role(self.request.user, org_id, ORG_MANAGEMENT_ROLES)
        self._log_audit(action="role.delete", resource_type="role", resource_id=instance.id, old_value=RoleSerializer(instance).data)
        instance.delete()


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """List all available permissions."""

    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    queryset = Permission.objects.all()
