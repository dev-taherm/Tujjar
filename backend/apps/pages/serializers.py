from __future__ import annotations

from django.utils.text import slugify
from rest_framework import serializers

from apps.core.utils import resolve_organization

from .models import Page, PageVersion
from .section_registry import get_section_types


class PageVersionSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True, default="")

    class Meta:
        model = PageVersion
        fields = [
            "id",
            "page",
            "version",
            "content_schema",
            "created_by",
            "created_by_email",
            "change_summary",
            "created_at",
        ]
        read_only_fields = fields


class PageSerializer(serializers.ModelSerializer):
    section_count = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = [
            "id",
            "organization",
            "store",
            "title",
            "slug",
            "page_type",
            "content_schema",
            "theme_override",
            "seo_title",
            "seo_description",
            "is_published",
            "published_at",
            "created_by",
            "version",
            "section_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "created_by",
            "version",
            "published_at",
            "created_at",
            "updated_at",
        ]

    def get_section_count(self, obj) -> int:
        return len(obj.get_sections())

    def validate_slug(self, value):
        slug = slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        instance = self.instance
        qs = Page.objects.filter(slug=slug, store_id=self.initial_data.get("store"))
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This slug is already taken for this store.")
        return slug

    def create(self, validated_data):
        validated_data["organization"] = resolve_organization(self.context["request"].org_id)
        validated_data["created_by"] = self.context["request"].user
        if "content_schema" not in validated_data:
            validated_data["content_schema"] = {"sections": []}
        return super().create(validated_data)


class SectionTypeSerializer(serializers.Serializer):
    type = serializers.CharField()
    label = serializers.CharField()
    category = serializers.CharField()
    icon = serializers.CharField()
    defaultSettings = serializers.DictField()
    settingsSchema = serializers.ListField()
