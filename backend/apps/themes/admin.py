from django.contrib import admin

from apps.core.admin import TenantAdminMixin, TenantTabularInline

from .models import Theme, ThemePreset


class ThemePresetInline(TenantTabularInline):
    model = ThemePreset
    extra = 0


@admin.register(Theme)
class ThemeAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "slug", "version", "is_system", "is_active", "created_at"]
    list_filter = ["is_system", "is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ThemePresetInline]


@admin.register(ThemePreset)
class ThemePresetAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "theme", "created_at"]
    list_filter = ["theme"]
    search_fields = ["name"]
