from django.contrib import admin

from apps.core.admin import TenantAdminMixin

from .models import Organization, OrganizationMembership, Permission, Role


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "created_at"]
    search_fields = ["name", "slug"]
    list_filter = ["is_active"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Role)
class RoleAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "slug", "is_system", "organization"]
    list_filter = ["is_system"]
    search_fields = ["name", "slug"]


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ["name", "codename", "module"]
    list_filter = ["module"]
    search_fields = ["name", "codename"]


@admin.register(OrganizationMembership)
class OrganizationMembershipAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["user", "organization", "role", "is_accepted", "invited_at"]
    list_filter = ["is_accepted", "role"]
