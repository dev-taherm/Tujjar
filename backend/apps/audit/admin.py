from django.contrib import admin

from apps.core.admin import TenantAdminMixin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["action", "resource_type", "resource_id", "user", "created_at"]
    list_filter = ["action", "resource_type", "created_at"]
    search_fields = ["resource_id", "action"]
    readonly_fields = [
        "id",
        "organization",
        "user",
        "action",
        "resource_type",
        "resource_id",
        "old_value",
        "new_value",
        "ip_address",
        "user_agent",
        "created_at",
    ]
