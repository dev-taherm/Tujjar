from django.contrib import admin

from .models import Cart, CartItem, Order, OrderItem


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ["id", "store", "customer", "status", "subtotal", "currency", "created_at"]
    list_filter = ["status", "store", "currency"]
    search_fields = ["session_key"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ["cart", "product", "variant", "quantity", "unit_price", "created_at"]
    list_filter = ["cart", "product"]
    search_fields = ["product__title"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number",
        "store",
        "customer",
        "status",
        "payment_status",
        "total",
        "currency",
        "created_at",
    ]
    list_filter = ["status", "payment_status", "store", "currency", "source"]
    search_fields = [
        "order_number",
        "customer_email",
        "customer_first_name",
        "customer_last_name",
        "tracking_number",
    ]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ["order", "title", "sku", "quantity", "unit_price", "total_price", "created_at"]
    list_filter = ["order"]
    search_fields = ["title", "sku"]
    readonly_fields = ["created_at", "updated_at"]
