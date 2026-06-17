from __future__ import annotations

import copy

from django.utils.text import slugify
from rest_framework import serializers

from apps.core.utils import resolve_organization

from .models import Theme, ThemePreset


class ThemePresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemePreset
        fields = ["id", "name", "config", "preview_image", "created_at"]
        read_only_fields = ["id", "created_at"]


class ThemeSerializer(serializers.ModelSerializer):
    presets = ThemePresetSerializer(many=True, read_only=True)
    effective_config = serializers.SerializerMethodField()

    class Meta:
        model = Theme
        fields = [
            "id",
            "organization",
            "name",
            "slug",
            "version",
            "parent_theme",
            "config",
            "sections_schema",
            "assets",
            "preview_image",
            "is_system",
            "is_active",
            "presets",
            "effective_config",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "is_system",
            "created_at",
            "updated_at",
        ]

    def get_effective_config(self, obj) -> dict:
        return obj.get_effective_config()

    def validate_slug(self, value):
        slug = slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        instance = self.instance
        qs = Theme.objects.filter(slug=slug)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This slug is already taken.")
        return slug

    def create(self, validated_data):
        validated_data["organization"] = resolve_organization(self.context["request"].org_id)
        return super().create(validated_data)


class ThemeInstallSerializer(serializers.Serializer):
    """Install a system theme into the current organization."""

    store_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        theme = self.context["view"].get_object()
        if not theme.is_system:
            raise serializers.ValidationError("Only system themes can be installed.")
        store_id = attrs.get("store_id")
        if store_id:
            from apps.stores.models import Store

            request = self.context["request"]
            if not Store.objects.filter(id=store_id, organization_id=request.org_id).exists():
                raise serializers.ValidationError("Store not found.")
        return attrs

    def save(self, **kwargs):
        theme = self.context["view"].get_object()
        request = self.context["request"]
        store_id = self.validated_data.get("store_id")
        # Create a copy of the theme for this organization
        new_theme = Theme.objects.create(
            organization_id=request.org_id,
            name=theme.name,
            slug=f"{theme.slug}-{request.org_id}",
            version=theme.version,
            parent_theme=theme,
            config=copy.deepcopy(theme.config),
            sections_schema=copy.deepcopy(theme.sections_schema),
            assets=copy.deepcopy(theme.assets),
            is_system=False,
            is_active=True,
        )
        # Copy presets
        for preset in theme.presets.all():
            ThemePreset.objects.create(
                theme=new_theme,
                name=preset.name,
                config=copy.deepcopy(preset.config),
            )
        # Assign to store if store_id provided
        if store_id:
            from apps.stores.models import Store

            store = Store.objects.get(id=store_id, organization_id=request.org_id)
            store.theme = new_theme
            store.save()
        return new_theme


class ThemeDuplicateSerializer(serializers.Serializer):
    """Duplicate a theme."""

    name = serializers.CharField(max_length=255)

    def save(self, **kwargs):
        theme = self.context["view"].get_object()
        new_name = self.validated_data["name"]
        new_theme = Theme.objects.create(
            organization=theme.organization,
            name=new_name,
            slug=slugify(new_name),
            version="1.0.0",
            parent_theme=theme,
            config=copy.deepcopy(theme.config),
            sections_schema=copy.deepcopy(theme.sections_schema),
            assets=copy.deepcopy(theme.assets),
            is_system=False,
            is_active=True,
        )
        for preset in theme.presets.all():
            ThemePreset.objects.create(
                theme=new_theme,
                name=preset.name,
                config=copy.deepcopy(preset.config),
            )
        return new_theme
