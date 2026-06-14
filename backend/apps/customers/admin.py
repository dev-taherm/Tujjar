from django.contrib import admin

from apps.core.admin import TenantAdminMixin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = [
        "email",
        "first_name",
        "last_name",
        "store",
        "phone",
        "orders_count",
        "total_spent",
        "loyalty_points",
        "is_verified",
        "created_at",
    ]
    list_filter = ["is_verified", "store", "country"]
    search_fields = ["email", "first_name", "last_name", "phone", "company"]
    readonly_fields = ["created_at", "updated_at"]
