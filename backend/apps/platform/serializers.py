from __future__ import annotations

from rest_framework import serializers

from apps.authentication.models import User
from apps.organizations.models import Organization
from apps.stores.models import Store
from apps.billing.models import Plan, Subscription
from apps.platform.models import SystemConfig


class PlatformUserSerializer(serializers.ModelSerializer):
    organization_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "is_active", "is_staff", "is_verified", "is_superuser",
            "two_factor_enabled", "provider", "last_login", "created_at",
            "organization_count",
        ]
        read_only_fields = ["id", "email", "created_at", "last_login"]

    def get_organization_count(self, obj) -> int:
        return obj.memberships.count()


class PlatformOrganizationSerializer(serializers.ModelSerializer):
    owner_email = serializers.SerializerMethodField()
    store_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id", "name", "slug", "is_active", "created_at",
            "owner_email", "store_count", "member_count", "subscription_status",
        ]

    def get_owner_email(self, obj) -> str | None:
        owner = obj.owner
        return owner.email if owner else None

    def get_store_count(self, obj) -> int:
        return obj.stores.count()

    def get_member_count(self, obj) -> int:
        return obj.memberships.count()

    def get_subscription_status(self, obj) -> str | None:
        try:
            return obj.subscription.status
        except Subscription.DoesNotExist:
            return None


class PlatformStoreSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    owner_email = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            "id", "name", "slug", "custom_domain", "is_active",
            "organization", "organization_name", "owner_email", "created_at",
        ]

    def get_owner_email(self, obj) -> str | None:
        owner = obj.organization.owner
        return owner.email if owner else None


class PlatformPlanSerializer(serializers.ModelSerializer):
    subscription_count = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = [
            "id", "name", "slug", "description", "price", "currency",
            "interval", "trial_days", "max_products", "max_orders",
            "max_storage_gb", "max_ai_generations", "features",
            "is_active", "is_system", "subscription_count", "created_at",
        ]

    def get_subscription_count(self, obj) -> int:
        return obj.subscriptions.count()


class SystemConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfig
        fields = ["id", "key", "value", "description", "created_at", "updated_at"]
