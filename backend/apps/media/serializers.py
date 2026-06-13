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


ALLOWED_UPLOAD_MIME_TYPES = {
    "image": ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
    "video": ["video/mp4", "video/webm", "video/ogg"],
    "document": [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
    ],
}

BLOCKED_EXTENSIONS = {
    ".php", ".php3", ".php4", ".php5", ".phtml",
    ".exe", ".bat", ".cmd", ".com", ".msi",
    ".sh", ".bash", ".csh", ".ksh",
    ".js", ".vbs", ".vbe", ".wsf", ".wsc",
    ".scr", ".pif", ".hta", ".cpl",
    ".jar", ".class",
}

MAX_UPLOAD_SIZE_MB = 50
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024


class MediaUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    folder = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(required=False, default="")
    alt_text = serializers.CharField(required=False, default="")
    store = serializers.UUIDField(required=False, allow_null=True)

    def validate_file(self, value):
        import os

        if value.size > MAX_UPLOAD_SIZE_BYTES:
            raise serializers.ValidationError(
                f"File size exceeds maximum allowed size of {MAX_UPLOAD_SIZE_MB}MB."
            )

        ext = os.path.splitext(value.name)[1].lower()
        if ext in BLOCKED_EXTENSIONS:
            raise serializers.ValidationError(
                f"File type '{ext}' is not allowed for security reasons."
            )

        content_type = getattr(value, "content_type", None)
        if content_type:
            allowed = []
            for mime_list in ALLOWED_UPLOAD_MIME_TYPES.values():
                allowed.extend(mime_list)
            if content_type not in allowed:
                raise serializers.ValidationError(
                    f"File type '{content_type}' is not allowed."
                )

        return value
