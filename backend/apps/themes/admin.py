from django.contrib import admin

from apps.core.admin import TenantAdminMixin, TenantTabularInline

from .models import Theme, ThemePreset, ThemeVersion


class ThemePresetInline(TenantTabularInline):
    model = ThemePreset
    extra = 0


class ThemeVersionInline(TenantTabularInline):
    model = ThemeVersion
    extra = 0
    readonly_fields = ["version", "note", "created_by", "created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Theme)
class ThemeAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "slug", "version", "is_system", "is_active", "category", "created_at"]
    list_filter = ["is_system", "is_active", "category"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ThemePresetInline, ThemeVersionInline]


@admin.register(ThemePreset)
class ThemePresetAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "theme", "created_at"]
    list_filter = ["theme"]
    search_fields = ["name"]


@admin.register(ThemeVersion)
class ThemeVersionAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["theme", "version", "note", "created_by", "created_at"]
    list_filter = ["theme"]
    search_fields = ["version", "note"]
    readonly_fields = [
        "theme",
        "version",
        "config",
        "sections_schema",
        "assets",
        "note",
        "created_by",
        "created_at",
    ]
