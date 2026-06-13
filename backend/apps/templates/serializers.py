from __future__ import annotations

from rest_framework import serializers

from .models import Template


class TemplateListSerializer(serializers.ModelSerializer):
    page_count = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = [
            "id", "name", "slug", "description", "version", "category",
            "author", "thumbnail", "preview_images", "tags",
            "is_system", "is_premium", "page_count", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_page_count(self, obj):
        return len(obj.pages) if obj.pages else 0


class TemplateDetailSerializer(serializers.ModelSerializer):
    page_count = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = [
            "id", "name", "slug", "description", "version", "category",
            "author", "thumbnail", "preview_images", "tags",
            "is_system", "is_premium",
            "config", "presets", "pages", "navigation", "footer",
            "seo_defaults", "demo_content", "store_settings",
            "page_count", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_page_count(self, obj):
        return len(obj.pages) if obj.pages else 0


class TemplateInstallSerializer(serializers.Serializer):
    template_id = serializers.UUIDField()

    def validate_template_id(self, value):
        try:
            template = Template.objects.get(id=value)
        except Template.DoesNotExist:
            raise serializers.ValidationError("Template not found.")
        return value


class TemplateExportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = [
            "name", "slug", "description", "version", "category",
            "author", "tags", "config", "presets", "pages",
            "navigation", "footer", "seo_defaults", "demo_content",
            "store_settings",
        ]


class TemplateImportSerializer(serializers.Serializer):
    data = serializers.JSONField()

    def validate_data(self, value):
        required_fields = ["name", "slug", "config", "pages"]
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Missing required field: {field}")
        return value
