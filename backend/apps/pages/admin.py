from django.contrib import admin

from .models import Page, PageVersion


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "store", "page_type", "is_published", "version", "created_at"]
    list_filter = ["page_type", "is_published"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["version", "published_at", "created_at", "updated_at"]


@admin.register(PageVersion)
class PageVersionAdmin(admin.ModelAdmin):
    list_display = ["page", "version", "change_summary", "created_at"]
    list_filter = ["page"]
    readonly_fields = ["page", "version", "content_schema", "created_by", "change_summary", "created_at"]
