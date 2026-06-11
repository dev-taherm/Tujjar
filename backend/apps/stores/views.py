from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.models import log_action

from .models import Store, StoreDomain
from .serializers import StoreDomainSerializer, StoreSerializer, StoreSettingsSerializer


class StoreViewSet(viewsets.ModelViewSet):
    """Store CRUD scoped to the current organization."""

    serializer_class = StoreSerializer

    def get_queryset(self):
        return Store.objects.filter(
            organization_id=self.request.org_id
        ).select_related("theme", "logo", "favicon")

    def perform_create(self, serializer):
        store = serializer.save()
        log_action(
            action="store.create",
            resource_type="store",
            resource_id=store.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            new_value=StoreSerializer(store).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    def perform_update(self, serializer):
        old_data = StoreSerializer(serializer.instance).data
        store = serializer.save()
        log_action(
            action="store.update",
            resource_type="store",
            resource_id=store.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            old_value=old_data,
            new_value=StoreSerializer(store).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    def perform_destroy(self, instance):
        log_action(
            action="store.delete",
            resource_type="store",
            resource_id=instance.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            old_value=StoreSerializer(instance).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )
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


class StoreDomainViewSet(viewsets.ModelViewSet):
    """Domain management for a store."""

    serializer_class = StoreDomainSerializer

    def get_queryset(self):
        return StoreDomain.objects.filter(
            store_id=self.kwargs["pk"]
        )

    def perform_create(self, serializer):
        serializer.save(store_id=self.kwargs["pk"])

    def perform_destroy(self, instance):
        instance.delete()
