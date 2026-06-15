from __future__ import annotations

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


class StoreSerializer(serializers.ModelSerializer):
    domain = serializers.ReadOnlyField()
    domains = StoreDomainSerializer(many=True, read_only=True)

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
            "theme",
            "template",
            "settings",
            "seo_title",
            "seo_description",
            "is_active",
            "navigation",
            "footer_config",
            "translations",
            "domain",
            "domains",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def validate_slug(self, value):
        slug = slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        if slug in RESERVED_SLUGS:
            raise serializers.ValidationError(f'"{slug}" is a reserved word and cannot be used as a slug.')
        instance = self.instance
        qs = Store.objects.filter(slug=slug)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This slug is already taken.")
        return slug

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

        store = Store.objects.create(**validated_data)

        if template_id:
            try:
                template = Template.objects.get(id=template_id)
                self._install_template(store, template)
            except Template.DoesNotExist:
                pass

        return store

    def _install_template(self, store, template):
        """Apply template to store (theme, navigation, footer, pages, etc.)."""
        from apps.themes.models import Theme

        if template.config:
            theme = Theme.objects.create(
                name=f"{store.name} Theme",
                organization=store.organization,
                config=template.config,
            )
            store.theme = theme

        if template.navigation:
            store.navigation = template.navigation
        if template.footer:
            store.footer_config = template.footer
        if template.store_settings:
            store.settings = template.store_settings

        store.template = template
        store.save()

        if template.pages:
            from apps.pages.models import Page
            for page_data in template.pages:
                if isinstance(page_data, dict):
                    Page.objects.create(
                        store=store,
                        title=page_data.get("title", "Page"),
                        slug=page_data.get("slug", "page"),
                        content_schema=page_data.get("content_schema", {}),
                        is_published=page_data.get("is_published", True),
                    )
