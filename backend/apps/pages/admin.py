from django.contrib import admin

from apps.core.admin import TenantAdminMixin, TenantTabularInline

from .models import Page, PageVersion


class PageVersionInline(TenantTabularInline):
    model = PageVersion
    extra = 0
    readonly_fields = ["page", "version", "content_schema", "created_by", "change_summary", "created_at"]


@admin.register(Page)
class PageAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["title", "slug", "store", "page_type", "is_published", "version", "created_at"]
    list_filter = ["page_type", "is_published"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["version", "published_at", "created_at", "updated_at"]
    inlines = [PageVersionInline]


@admin.register(PageVersion)
class PageVersionAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["page", "version", "change_summary", "created_at"]
    list_filter = ["page"]
    readonly_fields = ["page", "version", "content_schema", "created_by", "change_summary", "created_at"]
