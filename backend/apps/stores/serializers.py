from __future__ import annotations

import copy
import uuid as _uuid

from django.conf import settings
from django.core.validators import RegexValidator
from django.utils.text import slugify
from rest_framework import serializers

from apps.organizations.models import Organization

from .models import Store, StoreDomain

RESERVED_SLUGS = {
    "admin", "api", "www", "mail", "smtp", "imap", "ftp", "ns1", "ns2",
    "dns", "cdn", "assets", "static", "media", "blog", "help", "support",
    "status", "docs", "dev", "staging", "test", "beta", "app", "portal",
    "dashboard", "login", "register", "auth", "oauth", "sso",
}

slug_validator = RegexValidator(
    r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?$",
    "Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.",
)


class StoreDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreDomain
        fields = [
            "id",
            "domain",
            "is_primary",
            "verified",
            "created_at",
        ]
        read_only_fields = ["id", "verified", "created_at"]


DEFAULT_NAVIGATION = {
    "logo_text": "",
    "links": [
        {"label": "Home", "url": "/", "order": 0},
        {"label": "Shop", "url": "/shop", "order": 1},
    ],
    "cta_button": {"label": "Shop Now", "url": "/shop", "enabled": True},
}

DEFAULT_FOOTER = {
    "columns": [
        {
            "title": "Shop",
            "links": [
                {"label": "All Products", "url": "/shop"},
                {"label": "Collections", "url": "/shop/collections"},
            ],
        },
        {
            "title": "Help",
            "links": [
                {"label": "FAQ", "url": "/faq"},
                {"label": "Shipping", "url": "/shipping"},
                {"label": "Returns", "url": "/returns"},
            ],
        },
        {
            "title": "Company",
            "links": [
                {"label": "About Us", "url": "/about"},
                {"label": "Contact", "url": "/contact"},
            ],
        },
    ],
    "copyright": "",
    "social_links": {},
}


class StoreSerializer(serializers.ModelSerializer):
    domain = serializers.ReadOnlyField()
    domains = StoreDomainSerializer(many=True, read_only=True)
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            "id",
            "organization",
            "name",
            "slug",
            "custom_domain",
            "description",
            "logo",
            "favicon",
            "logo_url",
            "favicon_url",
            "theme",
            "template",
            "settings",
            "seo_title",
            "seo_description",
            "og_image",
            "og_image_url",
            "twitter_card",
            "is_active",
            "navigation",
            "footer_config",
            "translations",
            "domain",
            "domains",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "slug", "custom_domain", "created_at", "updated_at"]

    def get_logo_url(self, obj):
        if obj.logo_id:
            try:
                return obj.logo.file_url
            except Exception:
                return None
        return None

    def get_favicon_url(self, obj):
        if obj.favicon_id:
            try:
                return obj.favicon.file_url
            except Exception:
                return None
        return None

    def get_og_image_url(self, obj):
        if obj.og_image_id:
            try:
                return obj.og_image.file_url
            except Exception:
                return None
        return None

    def _validate_media_ownership(self, media_id, field_name):
        if media_id is None:
            return
        from apps.media.models import MediaAsset
        org_id = self.context["request"].org_id
        if not MediaAsset.objects.filter(id=media_id, organization_id=org_id).exists():
            raise serializers.ValidationError(
                {field_name: "Media asset not found or does not belong to your organization."}
            )

    def validate_logo(self, value):
        self._validate_media_ownership(value, "logo")
        return value

    def validate_favicon(self, value):
        self._validate_media_ownership(value, "favicon")
        return value

    def validate_og_image(self, value):
        self._validate_media_ownership(value, "og_image")
        return value

    def create(self, validated_data):
        org_id = self.context["request"].org_id
        if not org_id:
            raise serializers.ValidationError("You must belong to an organization to create a store.")
        try:
            validated_data["organization"] = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            raise serializers.ValidationError("Organization not found.")
        return super().create(validated_data)


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ["settings"]


class SlugCheckSerializer(serializers.Serializer):
    slug = serializers.CharField(max_length=255)

    def validate_slug(self, value):
        slug = slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        if len(slug) < 3:
            raise serializers.ValidationError("Slug must be at least 3 characters.")
        if slug in RESERVED_SLUGS:
            raise serializers.ValidationError(f'"{slug}" is a reserved word.')
        return slug


class StoreWizardSerializer(serializers.Serializer):
    """Multi-step store creation wizard."""
    name = serializers.CharField(max_length=255)
    slug = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, default="")
    template_id = serializers.UUIDField(required=False, allow_null=True)
    logo_id = serializers.UUIDField(required=False, allow_null=True)
    custom_domain = serializers.CharField(max_length=255, required=False, allow_blank=True)
    home_page = serializers.ChoiceField(
        choices=["/", "/shop", "/shop/blog"],
        default="/",
        required=False,
    )
    enable_shop = serializers.BooleanField(default=True, required=False)
    enable_blog = serializers.BooleanField(default=False, required=False)

    def validate_slug(self, value):
        if value:
            slug = slugify(value)
        else:
            slug = slugify(self.initial_data.get("name", ""))
        if not slug:
            raise serializers.ValidationError("Could not generate a valid slug from the store name.")
        if len(slug) < 3:
            raise serializers.ValidationError("Slug must be at least 3 characters.")
        if slug in RESERVED_SLUGS:
            raise serializers.ValidationError(f'"{slug}" is a reserved word.')
        return slug

    def validate_custom_domain(self, value):
        if value and Store.objects.filter(custom_domain=value).exists():
            raise serializers.ValidationError("This domain is already in use.")
        return value

    def validate(self, attrs):
        slug = attrs.get("slug") or slugify(attrs.get("name", ""))
        org_id = self.context["request"].org_id
        if org_id and Store.objects.filter(organization_id=org_id, slug=slug).exists():
            raise serializers.ValidationError({"slug": "You already have a store with this slug."})
        template_id = attrs.get("template_id")
        if template_id:
            from apps.templates.models import Template
            if not Template.objects.filter(id=template_id).exists():
                raise serializers.ValidationError({"template_id": "Template not found."})
        return attrs

    def create(self, validated_data):
        from django.db import transaction
        from apps.templates.models import Template

        org_id = self.context["request"].org_id
        template_id = validated_data.pop("template_id", None)
        logo_id = validated_data.pop("logo_id", None)
        custom_domain = validated_data.pop("custom_domain", "")

        slug = validated_data.get("slug") or slugify(validated_data["name"])
        validated_data["slug"] = slug

        try:
            validated_data["organization"] = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            raise serializers.ValidationError("Organization not found.")

        if custom_domain:
            validated_data["custom_domain"] = custom_domain

        if logo_id:
            from apps.media.models import MediaAsset
            try:
                logo = MediaAsset.objects.get(id=logo_id, organization_id=org_id)
                validated_data["logo"] = logo
            except MediaAsset.DoesNotExist:
                pass

        home_page = validated_data.pop("home_page", "/")
        enable_shop = validated_data.pop("enable_shop", True)
        enable_blog = validated_data.pop("enable_blog", False)

        if home_page == "/shop":
            enable_shop = True
        if home_page == "/shop/blog":
            enable_blog = True

        links = [{"label": "Home", "url": home_page, "order": 0}]
        order = 1
        if enable_shop and home_page != "/shop":
            links.append({"label": "Shop", "url": "/shop", "order": order})
            order += 1
        if enable_blog and home_page != "/shop/blog":
            links.append({"label": "Blog", "url": "/shop/blog", "order": order})
            order += 1

        validated_data["navigation"] = {
            "logo_text": "",
            "links": links,
            "cta_button": {
                "label": "Shop Now",
                "url": "/shop",
                "enabled": enable_shop,
            },
        }

        if not validated_data.get("footer_config"):
            validated_data["footer_config"] = copy.deepcopy(DEFAULT_FOOTER)

        user_navigation = copy.deepcopy(validated_data["navigation"])

        with transaction.atomic():
            store = Store.objects.create(**validated_data)

            if template_id:
                try:
                    template = Template.objects.get(id=template_id)
                    self._install_template(store, template)
                except Template.DoesNotExist:
                    pass

            store.navigation = user_navigation
            store.save(update_fields=["navigation", "updated_at"])

        return store

    def _install_template(self, store, template):
        """Apply template to store (theme, navigation, footer, pages, etc.)."""
        from apps.themes.models import Theme, ThemePreset

        if template.config:
            theme_slug = f"{template.slug}-theme-{store.organization_id}"
            Theme.objects.filter(slug=theme_slug).delete()
            theme = Theme.objects.create(
                name=f"{template.name} Theme",
                slug=theme_slug,
                organization=store.organization,
                config=copy.deepcopy(template.config),
            )
            store.theme = theme

            for preset_data in (template.presets or []):
                ThemePreset.objects.create(
                    theme=theme,
                    name=preset_data["name"],
                    config=preset_data.get("config", {}),
                )

        if template.navigation:
            store.navigation = copy.deepcopy(template.navigation)
        if template.footer:
            store.footer_config = copy.deepcopy(template.footer)
        if template.store_settings:
            store.settings = template.store_settings

        store.template = template

        if template.seo_defaults:
            store.seo_title = template.seo_defaults.get("title_pattern", "")
            store.seo_description = template.seo_defaults.get("description_pattern", "")

        store.save()

        if template.pages:
            from apps.pages.models import Page
            for page_def in template.pages:
                if isinstance(page_def, dict):
                    sections = copy.deepcopy(page_def.get("sections", []))
                    for section in sections:
                        if "id" not in section:
                            section["id"] = str(_uuid.uuid4())

                    Page.objects.create(
                        organization_id=store.organization_id,
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
                    )

        if template.demo_content:
            from apps.products.models import Collection, Category
            for coll_data in template.demo_content.get("collections", []):
                Collection.objects.get_or_create(
                    organization_id=store.organization_id,
                    store=store,
                    slug=coll_data["slug"],
                    defaults={
                        "name": coll_data["name"],
                        "description": coll_data.get("description", ""),
                        "translations": coll_data.get("translations", {}),
                    },
                )
            for cat_data in template.demo_content.get("categories", []):
                Category.objects.get_or_create(
                    organization_id=store.organization_id,
                    store=store,
                    slug=cat_data["slug"],
                    defaults={
                        "name": cat_data["name"],
                        "description": cat_data.get("description", ""),
                        "translations": cat_data.get("translations", {}),
                    },
                )
