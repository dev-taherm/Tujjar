from __future__ import annotations

from django.db import models
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.viewsets import TenantViewSet

from .models import Theme, ThemePreset
from .serializers import (
    ThemeDuplicateSerializer,
    ThemeInstallSerializer,
    ThemePresetSerializer,
    ThemeSerializer,
)


class ThemeViewSet(TenantViewSet):
    """Theme CRUD and management."""

    serializer_class = ThemeSerializer
    required_permission = "themes.manage"

    def get_queryset(self):
        return Theme.objects.filter(
            models.Q(organization_id=self.request.org_id) | models.Q(is_system=True)
        ).distinct()

    def perform_create(self, serializer):
        theme = serializer.save()
        self._log_audit(action="theme.create", resource_type="theme", resource_id=theme.id, new_value=ThemeSerializer(theme).data)

    def perform_update(self, serializer):
        old_data = ThemeSerializer(serializer.instance).data
        theme = serializer.save()
        self._log_audit(action="theme.update", resource_type="theme", resource_id=theme.id, old_value=old_data, new_value=ThemeSerializer(theme).data)

    def perform_destroy(self, instance):
        if instance.is_system:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("System themes cannot be deleted.")
        self._log_audit(action="theme.delete", resource_type="theme", resource_id=instance.id, old_value=ThemeSerializer(instance).data)
        instance.delete()

    @action(detail=True, methods=["post"])
    def install(self, request, pk=None):
        """Install a system theme into the current organization."""
        serializer = ThemeInstallSerializer(
            data=request.data,
            context={"view": self, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        new_theme = serializer.save()
        return Response(
            ThemeSerializer(new_theme).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """Duplicate a theme."""
        serializer = ThemeDuplicateSerializer(data=request.data, context={"view": self, "request": request})
        serializer.is_valid(raise_exception=True)
        new_theme = serializer.save()
        return Response(
            ThemeSerializer(new_theme).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"])
    def export(self, request, pk=None):
        """Export theme as JSON."""
        theme = self.get_object()
        return Response({
            "name": theme.name,
            "version": theme.version,
            "config": theme.config,
            "sections_schema": theme.sections_schema,
            "assets": theme.assets,
            "presets": ThemePresetSerializer(theme.presets.all(), many=True).data,
        })

    @action(detail=False, methods=["get"])
    def marketplace(self, request):
        """List all system themes available for installation."""
        themes = Theme.objects.filter(is_system=True, is_active=True)
        page = self.paginate_queryset(themes)
        if page is not None:
            serializer = ThemeSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ThemeSerializer(themes, many=True)
        return Response(serializer.data)


class ThemePresetViewSet(TenantViewSet):
    """Preset management within a theme."""

    serializer_class = ThemePresetSerializer
    required_permission = "themes.manage"

    def get_queryset(self):
        return ThemePreset.objects.filter(
            theme_id=self.kwargs["theme_pk"],
            theme__organization_id=self.request.org_id,
        )

    def perform_create(self, serializer):
        serializer.save(theme_id=self.kwargs["theme_pk"])
