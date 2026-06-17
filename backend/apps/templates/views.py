from __future__ import annotations

import copy
import uuid as _uuid

from django.db import transaction
from django.utils.text import slugify
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.viewsets import TenantViewSet

from .models import Template, TemplateVersion
from .serializers import (
    TemplateCreateSerializer,
    TemplateDetailSerializer,
    TemplateExportSerializer,
    TemplateImportSerializer,
    TemplateListSerializer,
    TemplateUpdateSerializer,
)

ALLOWED_STORE_SETTINGS_KEYS = frozenset(
    {
        "description",
        "phone",
        "email",
        "address",
        "currency",
        "timezone",
        "language",
        "weight_unit",
        "logo",
        "favicon",
    }
)


def _bump_version(version: str) -> str:
    """Increment the patch version: 1.0.0 -> 1.0.1."""
    parts = version.split(".")
    if len(parts) == 3:
        parts[2] = str(int(parts[2]) + 1)
        return ".".join(parts)
    return version


def _save_version_snapshot(template, note: str = "", user=None):
    """Create a version snapshot of the current template state."""
    TemplateVersion.objects.create(
        template=template,
        version=template.version,
        config=copy.deepcopy(template.config),
        pages=copy.deepcopy(template.pages),
        navigation=copy.deepcopy(template.navigation),
        footer=copy.deepcopy(template.footer),
        seo_defaults=copy.deepcopy(template.seo_defaults),
        demo_content=copy.deepcopy(template.demo_content),
        store_settings=copy.deepcopy(template.store_settings),
        note=note,
        created_by=user,
    )


class TemplateViewSet(TenantViewSet):
    """Template CRUD with install/export/import/versioning actions."""

    required_permission = "pages.create"

    def get_serializer_class(self):
        if self.action == "list":
            return TemplateListSerializer
        if self.action == "create":
            return TemplateCreateSerializer
        if self.action in ("update", "partial_update"):
            return TemplateUpdateSerializer
        return TemplateDetailSerializer

    def get_queryset(self):
        qs = Template.objects.all()
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        template = serializer.save()
        _save_version_snapshot(template, note="Initial version", user=self.request.user)

    def perform_update(self, serializer):
        template = serializer.save()
        _save_version_snapshot(template, note="Auto-saved on update", user=self.request.user)
        template.version = _bump_version(template.version)
        template.save(update_fields=["version", "updated_at"])

    def perform_destroy(self, instance):
        if instance.is_system:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("System templates cannot be deleted.")
        instance.delete()

    @action(detail=True, methods=["post"])
    def install(self, request, pk=None):
        """Install a template into the current store."""
        template = self.get_object()
        store_id = request.data.get("store_id")
        if not store_id:
            return Response(
                {"detail": "store_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.stores.models import Store
        from apps.themes.models import Theme, ThemePreset

        try:
            store = Store.objects.get(id=store_id, organization_id=request.org_id)
        except Store.DoesNotExist:
            return Response(
                {"detail": "Store not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Count what will be replaced (for frontend confirmation)
        from apps.pages.models import Page
        from apps.products.models import Category, Collection

        existing_page_count = Page.objects.filter(
            organization_id=request.org_id, store=store
        ).count()
        existing_collection_count = Collection.objects.filter(
            organization_id=request.org_id, store=store
        ).count()
        existing_category_count = Category.objects.filter(
            organization_id=request.org_id, store=store
        ).count()

        with transaction.atomic():
            # 1. Create theme for the org (delete old if re-installing)
            theme_data = copy.deepcopy(template.config)
            theme_slug = f"{template.slug}-theme-{request.org_id}"
            Theme.objects.filter(slug=theme_slug).delete()
            theme = Theme.objects.create(
                organization_id=request.org_id,
                name=f"{template.name} Theme",
                slug=theme_slug,
                version=template.version,
                config=theme_data,
                sections_schema={
                    "sections": template.pages[0]["sections"] if template.pages else []
                },
                is_system=False,
                is_active=True,
            )

            # Create presets
            for preset_data in template.presets:
                ThemePreset.objects.create(
                    theme=theme,
                    name=preset_data["name"],
                    config=preset_data.get("config", {}),
                )

            # 2. Assign theme and template to store
            store.theme = theme
            store.template = template

            # 3. Set navigation and footer on store
            store.navigation = copy.deepcopy(template.navigation)
            store.footer_config = copy.deepcopy(template.footer)

            # 4. Apply store settings (whitelist safe keys)
            if template.store_settings:
                for key, value in template.store_settings.items():
                    if key in ALLOWED_STORE_SETTINGS_KEYS:
                        setattr(store, key, value)

            # Set SEO defaults from template
            if template.seo_defaults:
                store.seo_title = template.seo_defaults.get("title_pattern", "")
                store.seo_description = template.seo_defaults.get("description_pattern", "")

            store.save()

            # 5. Create pages (remove existing pages first)
            Page.objects.filter(organization_id=request.org_id, store=store).delete()

            created_pages = []
            for page_def in template.pages:
                sections = copy.deepcopy(page_def.get("sections", []))
                for section in sections:
                    if "id" not in section:
                        section["id"] = str(_uuid.uuid4())

                page = Page.objects.create(
                    organization_id=request.org_id,
                    store=store,
                    title=page_def.get("title", "Page"),
                    slug=page_def.get("slug", ""),
                    page_type=page_def.get("page_type", "custom"),
                    content_schema={"sections": sections},
                    seo_title=page_def.get("seo_title", "").replace("{{store_name}}", store.name),
                    seo_description=page_def.get("seo_description", "").replace(
                        "{{store_description}}", store.description or ""
                    ),
                    is_published=page_def.get("is_published", True),
                    published_at=page_def.get("published_at"),
                )
                created_pages.append(page)

            # 6. Create demo collections
            from apps.products.models import Collection

            for coll_data in template.demo_content.get("collections", []):
                Collection.objects.get_or_create(
                    organization_id=request.org_id,
                    store=store,
                    slug=coll_data["slug"],
                    defaults={
                        "name": coll_data["name"],
                        "description": coll_data.get("description", ""),
                        "translations": coll_data.get("translations", {}),
                    },
                )

            # 7. Create demo categories
            from apps.products.models import Category

            for cat_data in template.demo_content.get("categories", []):
                Category.objects.get_or_create(
                    organization_id=request.org_id,
                    store=store,
                    slug=cat_data["slug"],
                    defaults={
                        "name": cat_data["name"],
                        "description": cat_data.get("description", ""),
                        "translations": cat_data.get("translations", {}),
                    },
                )

            # 8. Version snapshot
            _save_version_snapshot(
                template,
                note=f"Installed to store '{store.name}'",
                user=request.user,
            )

            # Audit log
            self._log_audit(
                action="template.install",
                resource_type="template",
                resource_id=template.id,
                new_value={
                    "template": template.name,
                    "store": store.name,
                    "pages_created": len(created_pages),
                },
            )

        return Response(
            {
                "detail": f"Template '{template.name}' installed successfully.",
                "theme_id": str(theme.id),
                "pages_created": len(created_pages),
                "store_id": str(store.id),
                "replaced": {
                    "pages": existing_page_count,
                    "collections": existing_collection_count,
                    "categories": existing_category_count,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="preview-install")
    def preview_install(self, request, pk=None):
        """Preview what would be replaced when installing this template."""
        self.get_object()
        store_id = request.query_params.get("store_id")
        if not store_id:
            return Response(
                {"detail": "store_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.stores.models import Store

        try:
            store = Store.objects.get(id=store_id, organization_id=request.org_id)
        except Store.DoesNotExist:
            return Response(
                {"detail": "Store not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        from apps.pages.models import Page
        from apps.products.models import Category, Collection

        return Response(
            {
                "replaced": {
                    "pages": Page.objects.filter(
                        organization_id=request.org_id, store=store
                    ).count(),
                    "collections": Collection.objects.filter(
                        organization_id=request.org_id, store=store
                    ).count(),
                    "categories": Category.objects.filter(
                        organization_id=request.org_id, store=store
                    ).count(),
                }
            }
        )

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        """Get full template preview data."""
        template = self.get_object()
        return Response(TemplateDetailSerializer(template).data)

    @action(detail=True, methods=["get"])
    def export(self, request, pk=None):
        """Export template as JSON."""
        template = self.get_object()
        return Response(TemplateExportSerializer(template).data)

    @action(detail=False, methods=["post"], url_path="import")
    def import_template(self, request):
        """Import a template from JSON."""
        serializer = TemplateImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data["data"]

        # Check slug uniqueness
        if Template.objects.filter(slug=data["slug"]).exists():
            return Response(
                {"detail": "A template with this slug already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        template = Template.objects.create(
            name=data["name"],
            slug=data["slug"],
            description=data.get("description", ""),
            version=data.get("version", "1.0.0"),
            category=data.get("category", "general"),
            author=data.get("author", "Custom"),
            tags=data.get("tags", []),
            config=data.get("config", {}),
            presets=data.get("presets", []),
            pages=data.get("pages", []),
            navigation=data.get("navigation", {}),
            footer=data.get("footer", {}),
            seo_defaults=data.get("seo_defaults", {}),
            demo_content=data.get("demo_content", {}),
            store_settings=data.get("store_settings", {}),
            is_system=False,
        )

        _save_version_snapshot(template, note="Imported", user=request.user)

        return Response(
            TemplateDetailSerializer(template).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"])
    def installed(self, request):
        """Return the template installed on a specific store."""
        store_id = request.query_params.get("store_id")
        if not store_id:
            return Response(
                {"detail": "store_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.stores.models import Store

        try:
            store = Store.objects.get(id=store_id, organization_id=request.org_id)
        except Store.DoesNotExist:
            return Response(
                {"detail": "Store not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if store.template:
            return Response(TemplateDetailSerializer(store.template).data)

        return Response(None, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"])
    def marketplace(self, request):
        """List system templates only."""
        qs = Template.objects.filter(is_system=True)
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = TemplateListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = TemplateListSerializer(qs, many=True)
        return Response({"results": serializer.data})

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """Clone a template with a new name."""
        template = self.get_object()
        name = request.data.get("name", f"{template.name} Copy")
        new_slug = slugify(name)
        if not new_slug:
            new_slug = f"{template.slug}-copy"

        # Ensure unique slug
        base_slug = new_slug
        counter = 1
        while Template.objects.filter(slug=new_slug).exists():
            new_slug = f"{base_slug}-{counter}"
            counter += 1

        new_template = Template.objects.create(
            name=name,
            slug=new_slug,
            description=template.description,
            version="1.0.0",
            category=template.category,
            author=template.author,
            thumbnail=template.thumbnail,
            preview_images=copy.deepcopy(template.preview_images),
            tags=copy.deepcopy(template.tags),
            is_system=False,
            is_premium=template.is_premium,
            config=copy.deepcopy(template.config),
            presets=copy.deepcopy(template.presets),
            pages=copy.deepcopy(template.pages),
            navigation=copy.deepcopy(template.navigation),
            footer=copy.deepcopy(template.footer),
            seo_defaults=copy.deepcopy(template.seo_defaults),
            demo_content=copy.deepcopy(template.demo_content),
            store_settings=copy.deepcopy(template.store_settings),
        )

        _save_version_snapshot(
            new_template, note=f"Duplicated from '{template.name}'", user=request.user
        )

        return Response(
            TemplateDetailSerializer(new_template).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="versions")
    def versions(self, request, pk=None):
        """List version history for a template."""
        template = self.get_object()
        versions = template.versions.all()[:50]
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

    @action(detail=True, methods=["get"], url_path=r"versions/(?P<version_id>[^/.]+)")
    def version_detail(self, request, pk=None, version_id=None):
        """Fetch full state of a specific version."""
        template = self.get_object()
        try:
            version = TemplateVersion.objects.get(id=version_id, template=template)
        except TemplateVersion.DoesNotExist:
            return Response({"error": "Version not found"}, status=404)

        return Response(
            {
                "id": str(version.id),
                "version": version.version,
                "note": version.note,
                "created_at": version.created_at.isoformat() if version.created_at else None,
                "created_by": str(version.created_by_id) if version.created_by_id else None,
                "config": version.config,
                "pages": version.pages,
                "navigation": version.navigation,
                "footer": version.footer,
                "seo_defaults": version.seo_defaults,
                "demo_content": version.demo_content,
                "store_settings": version.store_settings,
            }
        )

    @action(detail=True, methods=["post"], url_path="rollback")
    def rollback(self, request, pk=None):
        """Rollback to a previous version."""
        template = self.get_object()
        version_id = request.data.get("version_id")
        if not version_id:
            return Response({"error": "version_id is required"}, status=400)
        try:
            version = TemplateVersion.objects.get(id=version_id, template=template)
        except TemplateVersion.DoesNotExist:
            return Response({"error": "Version not found"}, status=404)

        _save_version_snapshot(
            template, note=f"Before rollback to v{version.version}", user=request.user
        )
        template.config = copy.deepcopy(version.config)
        template.pages = copy.deepcopy(version.pages)
        template.navigation = copy.deepcopy(version.navigation)
        template.footer = copy.deepcopy(version.footer)
        template.seo_defaults = copy.deepcopy(version.seo_defaults)
        template.demo_content = copy.deepcopy(version.demo_content)
        template.store_settings = copy.deepcopy(version.store_settings)
        template.version = _bump_version(template.version)
        template.save(
            update_fields=[
                "config",
                "pages",
                "navigation",
                "footer",
                "seo_defaults",
                "demo_content",
                "store_settings",
                "version",
                "updated_at",
            ]
        )

        return Response(TemplateDetailSerializer(template).data)
