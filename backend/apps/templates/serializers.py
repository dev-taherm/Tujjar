from __future__ import annotations

from rest_framework import serializers

from .models import StoreBackup, Template


class TemplateListSerializer(serializers.ModelSerializer):
    page_count = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "version",
            "category",
            "author",
            "thumbnail",
            "preview_images",
            "tags",
            "is_system",
            "is_premium",
            "page_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_page_count(self, obj):
        return len(obj.pages) if obj.pages else 0


class TemplateDetailSerializer(serializers.ModelSerializer):
    page_count = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "version",
            "category",
            "author",
            "thumbnail",
            "preview_images",
            "tags",
            "is_system",
            "is_premium",
            "config",
            "presets",
            "pages",
            "navigation",
            "footer",
            "seo_defaults",
            "demo_content",
            "store_settings",
            "page_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "version", "is_system", "created_at", "updated_at"]

    def get_page_count(self, obj):
        return len(obj.pages) if obj.pages else 0

    def validate_slug(self, value):
        from django.utils.text import slugify as _slugify

        slug = _slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        instance = self.instance
        qs = Template.objects.filter(slug=slug)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This slug is already taken.")
        return slug


class TemplateCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = [
            "name",
            "slug",
            "description",
            "category",
            "author",
            "tags",
            "config",
            "presets",
            "pages",
            "navigation",
            "footer",
            "seo_defaults",
            "demo_content",
            "store_settings",
        ]

    def validate_slug(self, value):
        from django.utils.text import slugify as _slugify

        slug = _slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        if Template.objects.filter(slug=slug).exists():
            raise serializers.ValidationError("This slug is already taken.")
        return slug

    def create(self, validated_data):
        validated_data.setdefault("version", "1.0.0")
        validated_data.setdefault("is_system", False)
        return super().create(validated_data)


class TemplateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = [
            "name",
            "slug",
            "description",
            "category",
            "author",
            "tags",
            "thumbnail",
            "preview_images",
            "config",
            "presets",
            "pages",
            "navigation",
            "footer",
            "seo_defaults",
            "demo_content",
            "store_settings",
        ]

    def validate_slug(self, value):
        from django.utils.text import slugify as _slugify

        slug = _slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        instance = self.instance
        qs = Template.objects.filter(slug=slug)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This slug is already taken.")
        return slug


class TemplateExportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = [
            "name",
            "slug",
            "description",
            "version",
            "category",
            "author",
            "tags",
            "config",
            "presets",
            "pages",
            "navigation",
            "footer",
            "seo_defaults",
            "demo_content",
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


class TemplateInstallSerializer(serializers.Serializer):
    store_id = serializers.UUIDField()


class StoreBackupSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template.name", read_only=True, default="")
    created_by_email = serializers.CharField(source="created_by.email", read_only=True, default="")
    page_count = serializers.SerializerMethodField()

    class Meta:
        model = StoreBackup
        fields = [
            "id",
            "store",
            "template",
            "template_name",
            "pages",
            "navigation",
            "footer",
            "seo_defaults",
            "theme_config",
            "note",
            "created_by",
            "created_by_email",
            "page_count",
            "created_at",
        ]
        read_only_fields = fields

    def get_page_count(self, obj):
        return len(obj.pages) if obj.pages else 0
