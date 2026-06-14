from django.contrib import admin

from apps.core.admin import TenantAdminMixin

from .models import MediaAsset, MediaFolder


@admin.register(MediaFolder)
class MediaFolderAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "store", "parent", "path", "created_at"]
    list_filter = ["store"]
    search_fields = ["name", "path"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(MediaAsset)
class MediaAssetAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = [
        "filename",
        "title",
        "store",
        "file_type",
        "mime_type",
        "file_size",
        "storage_backend",
        "used_in_products",
        "used_in_pages",
        "created_at",
    ]
    list_filter = ["file_type", "storage_backend", "store"]
    search_fields = ["filename", "title", "original_filename", "alt_text", "mime_type"]
    readonly_fields = ["created_at", "updated_at"]
