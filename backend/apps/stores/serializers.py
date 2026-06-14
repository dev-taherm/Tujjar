from __future__ import annotations

from django.utils.text import slugify
from rest_framework import serializers

from apps.organizations.models import Organization

from .models import Store, StoreDomain


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
