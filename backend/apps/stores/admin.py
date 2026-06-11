from django.contrib import admin

from .models import Store, StoreDomain


class StoreDomainInline(admin.TabularInline):
    model = StoreDomain
    extra = 0


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "organization", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [StoreDomainInline]


@admin.register(StoreDomain)
class StoreDomainAdmin(admin.ModelAdmin):
    list_display = ["domain", "store", "is_primary", "verified"]
    list_filter = ["is_primary", "verified"]
    search_fields = ["domain"]
