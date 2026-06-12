from __future__ import annotations

from rest_framework import serializers

from .models import MediaAsset, MediaFolder


class MediaFolderSerializer(serializers.ModelSerializer):
    asset_count = serializers.SerializerMethodField()

    class Meta:
        model = MediaFolder
        fields = [
            "id", "organization", "store", "name", "parent",
            "path", "asset_count", "created_at",
        ]
        read_only_fields = ["id", "organization", "path", "created_at"]

    def get_asset_count(self, obj) -> int:
        return obj.assets.count()


class MediaAssetSerializer(serializers.ModelSerializer):
    file_size_display = serializers.CharField(read_only=True)
    is_image = serializers.BooleanField(read_only=True)
    folder_name = serializers.CharField(source="folder.name", read_only=True, default=None)

    class Meta:
        model = MediaAsset
        fields = [
            "id", "organization", "store", "folder", "folder_name",
            "title", "filename", "original_filename", "file_type",
            "mime_type", "file_size", "file_size_display",
            "file_url", "thumbnail_url", "cdn_url",
            "storage_backend", "storage_path",
            "width", "height", "alt_text", "title_attr",
            "used_in_products", "used_in_pages",
            "is_image", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "organization", "file_size", "storage_backend",
            "storage_path", "created_at", "updated_at",
        ]


class MediaUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    folder = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(required=False, default="")
    alt_text = serializers.CharField(required=False, default="")
    store = serializers.UUIDField(required=False, allow_null=True)
