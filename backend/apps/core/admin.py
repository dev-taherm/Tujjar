from __future__ import annotations

from django.contrib import admin


class TenantAdminMixin:
    """
    Mixin for Django admin to scope querysets by the current user's organization.
    Works with the thread-local middleware to provide multi-tenant isolation in admin.
    """

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        org_id = getattr(request, "org_id", None)
        if org_id and hasattr(qs.model, "organization_id"):
            qs = qs.filter(organization_id=org_id)
        return qs

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if "organization" not in readonly and "organization_id" not in readonly:
            if hasattr(self.model, "organization_id") or hasattr(self.model, "organization"):
                readonly.append("organization")
        return readonly

    def save_model(self, request, obj, form, change):
        if not change and hasattr(obj, "organization_id") and not obj.organization_id:
            org_id = getattr(request, "org_id", None)
            if org_id:
                obj.organization_id = org_id
        super().save_model(request, obj, form, change)


class TenantModelAdmin(TenantAdminMixin, admin.ModelAdmin):
    """Base ModelAdmin with tenant isolation."""
    pass


class TenantTabularInline(TenantAdminMixin, admin.TabularInline):
    """TabularInline with tenant isolation."""
    pass


class TenantStackedInline(TenantAdminMixin, admin.StackedInline):
    """StackedInline with tenant isolation."""
    pass
