from __future__ import annotations

from django.contrib import admin

from .models import Template, TemplateVersion


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
