from __future__ import annotations

from django.contrib import admin

from apps.core.admin import TenantAdminMixin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ("order", "provider", "amount", "currency", "status", "created_at")
    list_filter = ("provider", "status")
    search_fields = ("provider_ref", "order__order_number")
