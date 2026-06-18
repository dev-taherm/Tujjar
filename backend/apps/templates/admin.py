from __future__ import annotations

from django.contrib import admin

from .models import StoreBackup, Template, TemplateVersion


class TemplateVersionInline(admin.TabularInline):
    model = TemplateVersion
    extra = 0
    readonly_fields = ["version", "note", "created_by", "created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "category", "version", "author", "is_system", "is_premium"]
    list_filter = ["category", "is_system", "is_premium"]
    search_fields = ["name", "slug", "description"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]
    inlines = [TemplateVersionInline]


@admin.register(TemplateVersion)
class TemplateVersionAdmin(admin.ModelAdmin):
    list_display = ["template", "version", "note", "created_by", "created_at"]
    list_filter = ["template"]
    search_fields = ["version", "note"]
    readonly_fields = [
        "template",
        "version",
        "config",
        "pages",
        "navigation",
        "footer",
        "seo_defaults",
        "demo_content",
        "store_settings",
        "note",
        "created_by",
        "created_at",
    ]


@admin.register(StoreBackup)
class StoreBackupAdmin(admin.ModelAdmin):
    list_display = ["store", "template", "page_count", "note", "created_by", "created_at"]
    list_filter = ["store", "template"]
    search_fields = ["note", "store__name"]
    readonly_fields = [
        "store",
        "template",
        "pages",
        "navigation",
        "footer",
        "seo_defaults",
        "theme_config",
        "note",
        "created_by",
        "created_at",
    ]

    def page_count(self, obj):
        return len(obj.pages) if obj.pages else 0

    page_count.short_description = "Pages"
