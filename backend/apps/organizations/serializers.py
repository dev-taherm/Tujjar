from __future__ import annotations

from rest_framework import serializers

from .models import (
    Organization,
    OrganizationMembership,
    Permission,
    Role,
    RolePermission,
)


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "module", "description"]


class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(
        many=True, read_only=True, source="role_permissions.permission"
    )
    is_system = serializers.BooleanField(read_only=True)

    class Meta:
        model = Role
        fields = ["id", "name", "slug", "description", "is_system", "permissions"]


class OrganizationSerializer(serializers.ModelSerializer):
    owner_email = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "plan",
            "settings",
            "is_active",
            "logo",
            "owner_email",
            "member_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_owner_email(self, obj) -> str | None:
        owner = obj.owner
        return owner.email if owner else None

    def get_member_count(self, obj) -> int:
        return obj.memberships.filter(is_accepted=True).count()

    def validate_slug(self, value):
        if self.instance and self.instance.slug == value:
            return value
        if Organization.objects.filter(slug=value).exists():
            raise serializers.ValidationError("This slug is already taken.")
        return value


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()
    role_name = serializers.CharField(source="role.name", read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "role",
            "role_name",
            "is_accepted",
            "invited_at",
            "accepted_at",
        ]
        read_only_fields = ["id", "invited_at", "accepted_at"]

    def get_user_name(self, obj) -> str:
        return obj.user.full_name or obj.user.email


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role_slug = serializers.SlugField()

    def validate_role_slug(self, value):
        try:
            self.role = Role.objects.get(slug=value, is_system=True)
        except Role.DoesNotExist:
            raise serializers.ValidationError("Invalid role.")
        return value

    def validate_email(self, value):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        if not User.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError("No active user found with this email.")
        return value
