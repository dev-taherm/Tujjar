from __future__ import annotations

from django.db import models
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.models import log_action

from .models import Page, PageVersion
from .section_registry import create_section, get_section_types
from .serializers import PageSerializer, PageVersionSerializer, SectionTypeSerializer


class PageViewSet(viewsets.ModelViewSet):
    """Page CRUD with content_schema management."""

    serializer_class = PageSerializer

    def get_queryset(self):
        qs = Page.objects.select_related("store").filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        page = serializer.save()
        log_action(
            action="page.create",
            resource_type="page",
            resource_id=page.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            new_value=PageSerializer(page).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    def perform_update(self, serializer):
        old_data = PageSerializer(serializer.instance).data
        page = serializer.save()
        log_action(
            action="page.update",
            resource_type="page",
            resource_id=page.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            old_value=old_data,
            new_value=PageSerializer(page).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    def perform_destroy(self, instance):
        log_action(
            action="page.delete",
            resource_type="page",
            resource_id=instance.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            old_value=PageSerializer(instance).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )
        instance.delete()

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish the page and create a version snapshot."""
        page = self.get_object()
        page.publish(user=request.user)
        return Response(PageSerializer(page).data)

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        """Unpublish the page."""
        page = self.get_object()
        page.unpublish()
        return Response(PageSerializer(page).data)

    @action(detail=True, methods=["get"])
    def versions(self, request, pk=None):
        """List all versions of the page."""
        page = self.get_object()
        versions = page.versions.all()
        serializer = PageVersionSerializer(versions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="versions/(?P<version_number>\d+)/restore")
    def restore_version(self, request, pk=None, version_number=None):
        """Restore page to a specific version."""
        page = self.get_object()
        try:
            page.restore_version(int(version_number), user=request.user)
        except PageVersion.DoesNotExist:
            return Response(
                {"detail": "Version not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(PageSerializer(page).data)

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        """Get page data for storefront preview."""
        page = self.get_object()
        return Response({
            "page": PageSerializer(page).data,
            "sections": page.get_sections(),
        })

    @action(detail=False, methods=["get"], url_path="section-types")
    def section_types(self, request):
        """List all available section type definitions."""
        types = get_section_types()
        serializer = SectionTypeSerializer(types, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="sections/add")
    def add_section(self, request, pk=None):
        """Add a section to the page."""
        page = self.get_object()
        section_type = request.data.get("type")
        position = request.data.get("position")
        section = create_section(section_type)
        if not section:
            return Response(
                {"detail": f"Invalid section type: {section_type}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Allow custom settings override
        if "settings" in request.data:
            section["settings"] = request.data["settings"]
        page.add_section(section, position=position)
        return Response(PageSerializer(page).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="sections/(?P<section_id>[^/]+)")
    def update_section(self, request, pk=None, section_id=None):
        """Update a section's settings."""
        page = self.get_object()
        settings = request.data.get("settings", {})
        page.update_section(section_id, settings)
        return Response(PageSerializer(page).data)

    @action(detail=True, methods=["delete"], url_path="sections/(?P<section_id>[^/]+)")
    def remove_section(self, request, pk=None, section_id=None):
        """Remove a section from the page."""
        page = self.get_object()
        page.remove_section(section_id)
        return Response(PageSerializer(page).data)

    @action(detail=True, methods=["post"], url_path="sections/(?P<section_id>[^/]+)/duplicate")
    def duplicate_section(self, request, pk=None, section_id=None):
        """Duplicate a section."""
        page = self.get_object()
        page.duplicate_section(section_id)
        return Response(PageSerializer(page).data)

    @action(detail=True, methods=["post"], url_path="sections/(?P<section_id>[^/]+)/toggle-visibility")
    def toggle_section_visibility(self, request, pk=None, section_id=None):
        """Toggle section visibility for a device."""
        page = self.get_object()
        device = request.data.get("device", "desktop")
        if device not in ("desktop", "tablet", "mobile"):
            return Response(
                {"detail": "Invalid device. Must be desktop, tablet, or mobile."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        page.toggle_section_visibility(section_id, device)
        return Response(PageSerializer(page).data)

    @action(detail=True, methods=["post"], url_path="sections/reorder")
    def reorder_sections(self, request, pk=None):
        """Reorder sections by providing ordered list of IDs."""
        page = self.get_object()
        section_ids = request.data.get("section_ids", [])
        page.reorder_sections(section_ids)
        return Response(PageSerializer(page).data)
