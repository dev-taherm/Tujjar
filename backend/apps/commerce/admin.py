from __future__ import annotations

from django.contrib import admin

from apps.core.admin import TenantAdminMixin

from .models import Discount, Refund, ShippingRate, ShippingZone, TaxRate


@admin.register(Discount)
class DiscountAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ("code", "type", "value", "used_count", "is_active", "valid_until")
    list_filter = ("type", "is_active")
    search_fields = ("code", "description")


@admin.register(TaxRate)
class TaxRateAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ("name", "rate", "country", "state", "postal_code", "is_default", "is_active")
    list_filter = ("is_active", "is_default", "inclusive")


class ShippingRateInline(admin.TabularInline):
    model = ShippingRate
    extra = 0


@admin.register(ShippingZone)
class ShippingZoneAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ("name", "countries", "is_active")
    list_filter = ("is_active",)
    inlines = [ShippingRateInline]


@admin.register(ShippingRate)
class ShippingRateAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ("name", "zone", "pricing_type", "price", "is_active")


@admin.register(Refund)
class RefundAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ("order", "amount", "status", "restock", "created_at")
    list_filter = ("status",)
