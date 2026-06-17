from __future__ import annotations

import copy

from django.db import models
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.viewsets import TenantViewSet

from .models import Theme, ThemePreset, ThemeVersion
from .serializers import (
    ThemeDuplicateSerializer,
    ThemeInstallSerializer,
    ThemePresetSerializer,
    ThemeSerializer,
)


def _bump_version(version: str) -> str:
    """Increment the patch version: 1.0.0 -> 1.0.1."""
    parts = version.split(".")
    if len(parts) == 3:
        parts[2] = str(int(parts[2]) + 1)
        return ".".join(parts)
    return version


def _save_version_snapshot(theme, note: str = "", user=None):
    """Create a version snapshot of the current theme state."""
    ThemeVersion.objects.create(
        theme=theme,
        version=theme.version,
        config=copy.deepcopy(theme.config),
        sections_schema=copy.deepcopy(theme.sections_schema),
        assets=copy.deepcopy(theme.assets),
        note=note,
        created_by=user,
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
        self._log_audit(
            action="theme.create",
            resource_type="theme",
            resource_id=theme.id,
            new_value=ThemeSerializer(theme).data,
        )

    def perform_update(self, serializer):
        old_data = ThemeSerializer(serializer.instance).data
        theme = serializer.save()
        _save_version_snapshot(theme, note="Auto-saved on update", user=self.request.user)
        theme.version = _bump_version(theme.version)
        theme.save(update_fields=["version", "updated_at"])
        self._log_audit(
            action="theme.update",
            resource_type="theme",
            resource_id=theme.id,
            old_value=old_data,
            new_value=ThemeSerializer(theme).data,
        )

    def perform_destroy(self, instance):
        if instance.is_system:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("System themes cannot be deleted.")
        self._log_audit(
            action="theme.delete",
            resource_type="theme",
            resource_id=instance.id,
            old_value=ThemeSerializer(instance).data,
        )
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
        serializer = ThemeDuplicateSerializer(
            data=request.data, context={"view": self, "request": request}
        )
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
        return Response(
            {
                "name": theme.name,
                "version": theme.version,
                "config": theme.config,
                "sections_schema": theme.sections_schema,
                "assets": theme.assets,
                "presets": ThemePresetSerializer(theme.presets.all(), many=True).data,
            }
        )

    @action(detail=True, methods=["get"], url_path="versions")
    def versions(self, request, pk=None):
        """List version history for a theme."""
        theme = self.get_object()
        versions = theme.versions.all()[:50]
        data = [
            {
                "id": str(v.id),
                "version": v.version,
                "note": v.note,
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "created_by": str(v.created_by_id) if v.created_by_id else None,
            }
            for v in versions
        ]
        return Response(data)

    @action(detail=True, methods=["post"], url_path="rollback")
    def rollback(self, request, pk=None):
        """Rollback to a previous version."""
        theme = self.get_object()
        version_id = request.data.get("version_id")
        if not version_id:
            return Response({"error": "version_id is required"}, status=400)
        try:
            version = ThemeVersion.objects.get(id=version_id, theme=theme)
        except ThemeVersion.DoesNotExist:
            return Response({"error": "Version not found"}, status=404)

        _save_version_snapshot(theme, note=f"Before rollback to v{version.version}", user=request.user)
        theme.config = copy.deepcopy(version.config)
        theme.sections_schema = copy.deepcopy(version.sections_schema)
        theme.assets = copy.deepcopy(version.assets)
        theme.version = _bump_version(theme.version)
        theme.save(update_fields=["config", "sections_schema", "assets", "version", "updated_at"])

        return Response(ThemeSerializer(theme).data)

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

    @action(detail=False, methods=["post"], url_path="import")
    def import_theme(self, request):
        """Import a theme from JSON data."""
        name = request.data.get("name", "Imported Theme")
        config = request.data.get("config", {})
        sections_schema = request.data.get("sections_schema", {})
        assets = request.data.get("assets", {})

        if not config:
            return Response({"error": "config is required"}, status=400)

        from django.utils.text import slugify

        slug = slugify(name)
        base_slug = slug
        counter = 1
        while Theme.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        theme = Theme.objects.create(
            organization_id=request.org_id,
            name=name,
            slug=slug,
            config=config,
            sections_schema=sections_schema,
            assets=assets,
            is_system=False,
            is_active=True,
        )

        presets = request.data.get("presets", [])
        for preset_data in presets:
            ThemePreset.objects.create(
                theme=theme,
                name=preset_data.get("name", "Default"),
                config=preset_data.get("config", {}),
            )

        return Response(ThemeSerializer(theme).data, status=status.HTTP_201_CREATED)


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
