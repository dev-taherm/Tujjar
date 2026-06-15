from __future__ import annotations

import logging

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.viewsets import TenantViewSet

from .models import Store, StoreDomain
from .serializers import SlugCheckSerializer, StoreDomainSerializer, StoreSerializer, StoreSettingsSerializer, StoreWizardSerializer

logger = logging.getLogger(__name__)


class SlugCheckView(APIView):
    """Check if a store slug is available."""

    permission_classes = [IsAuthenticated]
    throttle_classes = []

    def get(self, request):
        slug = request.query_params.get("slug", "")
        serializer = SlugCheckSerializer(data={"slug": slug})
        serializer.is_valid(raise_exception=True)
        clean_slug = serializer.validated_data["slug"]
        org_id = getattr(request, "org_id", None)
        exists = Store.objects.filter(slug=clean_slug)
        if org_id:
            exists = exists.filter(organization_id=org_id)
        return Response({
            "slug": clean_slug,
            "available": not exists.exists(),
        })


class StoreWizardView(APIView):
    """Multi-step store creation wizard."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StoreWizardSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        store = serializer.save()
        from apps.audit.models import log_action
        log_action(
            action="store.wizard_create",
            resource_type="store",
            resource_id=store.id,
            user=request.user,
            organization_id=getattr(request, "org_id", None),
            new_value=StoreSerializer(store).data,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response(StoreSerializer(store).data, status=status.HTTP_201_CREATED)


class StoreViewSet(TenantViewSet):
    """Store CRUD scoped to the current organization."""

    serializer_class = StoreSerializer
    required_permission = "settings.manage"

    def get_queryset(self):
        return Store.objects.filter(
            organization_id=self.request.org_id
        ).select_related("theme", "template", "logo", "favicon")

    def perform_create(self, serializer):
        store = serializer.save()
        self._log_audit(action="store.create", resource_type="store", resource_id=store.id, new_value=StoreSerializer(store).data)

    def perform_update(self, serializer):
        old_data = StoreSerializer(serializer.instance).data
        store = serializer.save()
        self._log_audit(action="store.update", resource_type="store", resource_id=store.id, old_value=old_data, new_value=StoreSerializer(store).data)

    def perform_destroy(self, instance):
        self._log_audit(action="store.delete", resource_type="store", resource_id=instance.id, old_value=StoreSerializer(instance).data)
        instance.delete()

    @action(detail=False, methods=["get"])
    def current(self, request):
        """Get the first active store for the current organization."""
        store = Store.objects.filter(
            organization_id=request.org_id, is_active=True
        ).first()
        if not store:
            return Response(
                {"detail": "No active store found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(StoreSerializer(store).data)

    @action(detail=True, methods=["patch"], url_path="update-settings")
    def update_settings(self, request, pk=None):
        store = self.get_object()
        serializer = StoreSettingsSerializer(store, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(StoreSerializer(store).data)


class StoreDomainViewSet(TenantViewSet):
    """Domain management for a store."""

    serializer_class = StoreDomainSerializer
    required_permission = "settings.manage"

    def get_queryset(self):
        from rest_framework.exceptions import PermissionDenied

        store = Store.objects.filter(
            id=self.kwargs["pk"],
            organization_id=self.request.org_id,
        ).first()
        if not store:
            raise PermissionDenied("Store not found or access denied.")
        return StoreDomain.objects.filter(store_id=self.kwargs["pk"])

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied

        store = Store.objects.filter(
            id=self.kwargs["pk"],
            organization_id=self.request.org_id,
        ).first()
        if not store:
            raise PermissionDenied("Store not found or access denied.")
        domain = serializer.save(store_id=self.kwargs["pk"])
        self._log_audit(action="store.domain.create", resource_type="store_domain", resource_id=domain.id, new_value={"domain": domain.domain, "store_id": str(store.id)})

    def perform_destroy(self, instance):
        self._log_audit(action="store.domain.delete", resource_type="store_domain", resource_id=instance.id, old_value={"domain": instance.domain})
        instance.delete()
