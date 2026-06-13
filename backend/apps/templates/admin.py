from __future__ import annotations

from django.contrib import admin

from .models import Template


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "category", "version", "author", "is_system", "is_premium"]
    list_filter = ["category", "is_system", "is_premium"]
    search_fields = ["name", "slug", "description"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]
