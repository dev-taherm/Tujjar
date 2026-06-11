from django.contrib import admin

from .models import Theme, ThemePreset


class ThemePresetInline(admin.TabularInline):
    model = ThemePreset
    extra = 0


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "version", "is_system", "is_active", "created_at"]
    list_filter = ["is_system", "is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ThemePresetInline]


@admin.register(ThemePreset)
class ThemePresetAdmin(admin.ModelAdmin):
    list_display = ["name", "theme", "created_at"]
    list_filter = ["theme"]
    search_fields = ["name"]
