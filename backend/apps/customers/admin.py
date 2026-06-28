from django.contrib import admin

from apps.core.admin import TenantAdminMixin

from .models import (
    Address,
    Customer,
    LoyaltyTransaction,
    Review,
    SavedCart,
    SavedCartItem,
    WishlistItem,
)


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


@admin.register(Address)
class AddressAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["label", "customer", "city", "country", "is_default", "created_at"]
    list_filter = ["is_default", "country"]
    search_fields = ["label", "customer__email", "city"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(WishlistItem)
class WishlistItemAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["customer", "product", "created_at"]
    search_fields = ["customer__email", "product__title"]
    readonly_fields = ["created_at"]


@admin.register(Review)
class ReviewAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["customer", "product", "rating", "is_approved", "created_at"]
    list_filter = ["is_approved", "rating"]
    search_fields = ["customer__email", "product__title", "title"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["customer", "type", "points", "balance", "created_at"]
    list_filter = ["type"]
    search_fields = ["customer__email", "description"]
    readonly_fields = ["created_at", "updated_at"]


class SavedCartItemInline(TenantAdminMixin, admin.TabularInline):
    model = SavedCartItem
    extra = 0
    readonly_fields = ["product", "variant", "quantity", "unit_price"]


@admin.register(SavedCart)
class SavedCartAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "customer", "item_count", "created_at"]
    search_fields = ["name", "customer__email"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [SavedCartItemInline]
