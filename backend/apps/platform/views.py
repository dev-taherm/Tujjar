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


class PlatformUserViewSet(viewsets.ModelViewSet):
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


class PlatformOrganizationViewSet(viewsets.ModelViewSet):
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
        is_active = request.data.get("is_active")
        if is_active is not None:
            instance.is_active = is_active
            instance.save(update_fields=["is_active"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class PlatformStoreViewSet(viewsets.ModelViewSet):
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
        is_active = request.data.get("is_active")
        if is_active is not None:
            instance.is_active = is_active
            instance.save(update_fields=["is_active"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class PlatformPlanViewSet(viewsets.ModelViewSet):
    """Manage subscription plans."""
    serializer_class = PlatformPlanSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        return Plan.objects.all().order_by("price")


class PlatformSystemConfigViewSet(viewsets.ModelViewSet):
    """Manage platform system configuration."""
    serializer_class = SystemConfigSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        return SystemConfig.objects.all().order_by("key")
