from __future__ import annotations

from django.utils import timezone
from django.db import models
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.models import log_action

from .models import Organization, OrganizationMembership, Permission, Role
from .serializers import (
    InviteMemberSerializer,
    OrganizationMembershipSerializer,
    OrganizationSerializer,
    PermissionSerializer,
    RoleSerializer,
)


class OrganizationViewSet(viewsets.ModelViewSet):
    """Organization CRUD and management."""

    serializer_class = OrganizationSerializer

    def get_queryset(self):
        return Organization.objects.filter(
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
        log_action(
            action="organization.create",
            resource_type="organization",
            resource_id=org.id,
            organization=org,
            user=self.request.user,
            new_value=serializer.data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    def perform_update(self, serializer):
        old_data = OrganizationSerializer(serializer.instance).data
        org = serializer.save()
        log_action(
            action="organization.update",
            resource_type="organization",
            resource_id=org.id,
            organization=org,
            user=self.request.user,
            old_value=old_data,
            new_value=serializer.data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        org = self.get_object()
        memberships = OrganizationMembership.objects.filter(
            organization=org, is_accepted=True
        ).select_related("user", "role")
        serializer = OrganizationMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
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

        log_action(
            action="organization.member.invite",
            resource_type="organization",
            resource_id=org.id,
            organization=org,
            user=request.user,
            new_value={"email": user.email, "role": role.slug},
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

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
        membership.delete()
        return Response({"message": "Member removed"})


class RoleViewSet(viewsets.ModelViewSet):
    """Role management within an organization."""

    serializer_class = RoleSerializer

    def get_queryset(self):
        org_id = self.kwargs.get("org_pk")
        return Role.objects.filter(
            models.Q(organization_id=org_id) | models.Q(is_system=True)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(organization_id=self.kwargs["org_pk"])


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """List all available permissions."""

    serializer_class = PermissionSerializer
    queryset = Permission.objects.all()
