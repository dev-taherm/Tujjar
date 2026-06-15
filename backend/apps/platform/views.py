from __future__ import annotations

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.authentication.models import User
from apps.organizations.models import Organization
from apps.stores.models import Store
from apps.billing.models import Plan, Subscription, Invoice
from apps.core.permissions import IsPlatformAdmin
from apps.core.viewsets import AuditLogMixin
from apps.platform.models import SystemConfig
from apps.platform.serializers import (
    PlatformUserSerializer,
    PlatformOrganizationSerializer,
    PlatformStoreSerializer,
    PlatformPlanSerializer,
    SystemConfigSerializer,
)


@api_view(["GET"])
@permission_classes([IsPlatformAdmin])
def platform_dashboard(request):
    """Platform-wide dashboard statistics."""
    now = timezone.now()
    thirty_days_ago = now - timezone.timedelta(days=30)

    total_users = User.objects.count()
    new_users_30d = User.objects.filter(created_at__gte=thirty_days_ago).count()
    total_orgs = Organization.objects.count()
    active_orgs = Organization.objects.filter(is_active=True).count()
    total_stores = Store.objects.count()
    active_stores = Store.objects.filter(is_active=True).count()
    total_subscriptions = Subscription.objects.count()
    active_subscriptions = Subscription.objects.filter(status="active").count()
    total_revenue = Invoice.objects.filter(status="paid").aggregate(
        total=Sum("amount")
    )["total"] or 0
    recent_users = PlatformUserSerializer(
        User.objects.order_by("-created_at")[:5], many=True
    ).data

    return Response({
        "total_users": total_users,
        "new_users_30d": new_users_30d,
        "total_organizations": total_orgs,
        "active_organizations": active_orgs,
        "total_stores": total_stores,
        "active_stores": active_stores,
        "total_subscriptions": total_subscriptions,
        "active_subscriptions": active_subscriptions,
        "total_revenue": str(total_revenue),
        "recent_users": recent_users,
    })


class PlatformUserViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Manage all users across the platform."""
    serializer_class = PlatformUserSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        qs = User.objects.all()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        is_staff = self.request.query_params.get("is_staff")
        if is_staff is not None:
            qs = qs.filter(is_staff=is_staff.lower() == "true")
        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        user = serializer.save()
        self._log_audit(action="platform.user.create", resource_type="user", resource_id=user.id, new_value=PlatformUserSerializer(user).data)

    def perform_update(self, serializer):
        old_data = PlatformUserSerializer(serializer.instance).data
        user = serializer.save()
        self._log_audit(action="platform.user.update", resource_type="user", resource_id=user.id, old_value=old_data, new_value=PlatformUserSerializer(user).data)

    def perform_destroy(self, instance):
        self._log_audit(action="platform.user.delete", resource_type="user", resource_id=instance.id, old_value=PlatformUserSerializer(instance).data)
        instance.delete()


class PlatformOrganizationViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Manage all organizations across the platform."""
    serializer_class = PlatformOrganizationSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        qs = Organization.objects.all()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(slug__icontains=search)
            )
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        return qs.order_by("-created_at")

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_is_active = instance.is_active
        is_active = request.data.get("is_active")
        if is_active is not None:
            instance.is_active = is_active
            instance.save(update_fields=["is_active"])
        serializer = self.get_serializer(instance)
        self._log_audit(
            action="platform.organization.update",
            resource_type="organization",
            resource_id=instance.id,
            old_value={"is_active": old_is_active},
            new_value={"is_active": instance.is_active},
        )
        return Response(serializer.data)

    def perform_create(self, serializer):
        org = serializer.save()
        self._log_audit(action="platform.organization.create", resource_type="organization", resource_id=org.id, new_value=PlatformOrganizationSerializer(org).data)

    def perform_destroy(self, instance):
        self._log_audit(action="platform.organization.delete", resource_type="organization", resource_id=instance.id, old_value=PlatformOrganizationSerializer(instance).data)
        instance.delete()


class PlatformStoreViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Manage all stores across the platform."""
    serializer_class = PlatformStoreSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        qs = Store.objects.select_related("organization").all()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(slug__icontains=search)
                | Q(organization__name__icontains=search)
            )
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        return qs.order_by("-created_at")

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_is_active = instance.is_active
        is_active = request.data.get("is_active")
        if is_active is not None:
            instance.is_active = is_active
            instance.save(update_fields=["is_active"])
        serializer = self.get_serializer(instance)
        self._log_audit(
            action="platform.store.update",
            resource_type="store",
            resource_id=instance.id,
            old_value={"is_active": old_is_active},
            new_value={"is_active": instance.is_active},
        )
        return Response(serializer.data)

    def perform_create(self, serializer):
        store = serializer.save()
        self._log_audit(action="platform.store.create", resource_type="store", resource_id=store.id, new_value=PlatformStoreSerializer(store).data)

    def perform_destroy(self, instance):
        self._log_audit(action="platform.store.delete", resource_type="store", resource_id=instance.id, old_value=PlatformStoreSerializer(instance).data)
        instance.delete()


class PlatformPlanViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Manage subscription plans."""
    serializer_class = PlatformPlanSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        return Plan.objects.all().order_by("price")

    def perform_create(self, serializer):
        plan = serializer.save()
        self._log_audit(action="platform.plan.create", resource_type="plan", resource_id=plan.id, new_value=PlatformPlanSerializer(plan).data)

    def perform_update(self, serializer):
        old_data = PlatformPlanSerializer(serializer.instance).data
        plan = serializer.save()
        self._log_audit(action="platform.plan.update", resource_type="plan", resource_id=plan.id, old_value=old_data, new_value=PlatformPlanSerializer(plan).data)

    def perform_destroy(self, instance):
        self._log_audit(action="platform.plan.delete", resource_type="plan", resource_id=instance.id, old_value=PlatformPlanSerializer(instance).data)
        instance.delete()


class PlatformSystemConfigViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Manage platform system configuration."""
    serializer_class = SystemConfigSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        return SystemConfig.objects.all().order_by("key")

    def perform_create(self, serializer):
        config = serializer.save()
        self._log_audit(action="platform.system_config.create", resource_type="system_config", resource_id=config.id, new_value=SystemConfigSerializer(config).data)

    def perform_update(self, serializer):
        old_data = SystemConfigSerializer(serializer.instance).data
        config = serializer.save()
        self._log_audit(action="platform.system_config.update", resource_type="system_config", resource_id=config.id, old_value=old_data, new_value=SystemConfigSerializer(config).data)

    def perform_destroy(self, instance):
        self._log_audit(action="platform.system_config.delete", resource_type="system_config", resource_id=instance.id, old_value=SystemConfigSerializer(instance).data)
        instance.delete()
