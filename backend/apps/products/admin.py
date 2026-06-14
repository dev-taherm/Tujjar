from django.contrib import admin

from apps.core.admin import TenantAdminMixin, TenantTabularInline

from .models import Category, Collection, Product, ProductImage, ProductVariant


@admin.register(Category)
class CategoryAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "store", "parent", "is_active", "sort_order", "created_at"]
    list_filter = ["is_active", "store"]
    search_fields = ["name", "slug", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Collection)
class CollectionAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "store", "is_active", "sort_order", "created_at"]
    list_filter = ["is_active", "store"]
    search_fields = ["name", "slug", "description"]
    readonly_fields = ["created_at", "updated_at"]
    filter_horizontal = ["products"]


@admin.register(Product)
class ProductAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = [
        "title",
        "store",
        "product_type",
        "status",
        "price",
        "inventory_quantity",
        "sku",
        "total_sold",
        "created_at",
    ]
    list_filter = ["status", "product_type", "is_taxable", "requires_shipping", "store"]
    search_fields = ["title", "slug", "sku", "barcode", "description"]
    readonly_fields = ["created_at", "updated_at"]
    filter_horizontal = ["categories"]


@admin.register(ProductVariant)
class ProductVariantAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = [
        "title",
        "product",
        "sku",
        "price",
        "inventory_quantity",
        "is_active",
        "sort_order",
        "created_at",
    ]
    list_filter = ["is_active", "track_inventory", "product"]
    search_fields = ["title", "sku", "barcode"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ProductImage)
class ProductImageAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["product", "position", "is_primary", "alt_text", "created_at"]
    list_filter = ["is_primary", "product"]
    search_fields = ["alt_text", "url"]
    readonly_fields = ["created_at", "updated_at"]
