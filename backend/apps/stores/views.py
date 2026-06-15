from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.viewsets import TenantViewSet

from .models import Store, StoreDomain
from .serializers import StoreDomainSerializer, StoreSerializer, StoreSettingsSerializer


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
