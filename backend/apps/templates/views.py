from __future__ import annotations

import copy
import uuid as _uuid

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.models import log_action

from .models import Template
from .serializers import (
    TemplateDetailSerializer,
    TemplateExportSerializer,
    TemplateImportSerializer,
    TemplateListSerializer,
)


class TemplateViewSet(viewsets.ModelViewSet):
    """Template CRUD with install/export/import actions."""

    def get_serializer_class(self):
        if self.action == "list":
            return TemplateListSerializer
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

        with transaction.atomic():
            # 1. Create theme for the org
            theme_data = copy.deepcopy(template.config)
            theme = Theme.objects.create(
                organization_id=request.org_id,
                name=f"{template.name} Theme",
                slug=f"{template.slug}-theme-{request.org_id}",
                version=template.version,
                config=theme_data,
                sections_schema={"sections": template.pages[0]["sections"] if template.pages else []},
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

            # 2. Assign theme to store
            store.theme = theme

            # 3. Set navigation and footer on store
            store.navigation = copy.deepcopy(template.navigation)
            store.footer_config = copy.deepcopy(template.footer)

            # 4. Apply store settings
            if template.store_settings:
                for key, value in template.store_settings.items():
                    if key not in ("name", "slug"):
                        setattr(store, key, value)

            # Set SEO defaults from template
            if template.seo_defaults:
                store.seo_title = template.seo_defaults.get("title_pattern", "")
                store.seo_description = template.seo_defaults.get("description_pattern", "")

            store.save()

            # 5. Create pages (remove auto-created homepage first)
            from apps.pages.models import Page

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
                    seo_title=page_def.get("seo_title", "").replace(
                        "{{store_name}}", store.name
                    ),
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
                    },
                )

            # Audit log
            log_action(
                action="template.install",
                resource_type="template",
                resource_id=template.id,
                organization_id=request.org_id,
                user=request.user,
                new_value={
                    "template": template.name,
                    "store": store.name,
                    "pages_created": len(created_pages),
                },
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )

        return Response(
            {
                "detail": f"Template '{template.name}' installed successfully.",
                "theme_id": str(theme.id),
                "pages_created": len(created_pages),
                "store_id": str(store.id),
            },
            status=status.HTTP_201_CREATED,
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

    @action(detail=False, methods=["post"])
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

        return Response(
            TemplateDetailSerializer(template).data,
            status=status.HTTP_201_CREATED,
        )

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
        return Response(serializer.data)
