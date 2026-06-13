from __future__ import annotations

from rest_framework import serializers


from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory


class CartItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)
    line_total = serializers.FloatField(read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id", "cart", "product", "variant", "quantity",
            "unit_price", "product_title", "line_total",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = [
            "id", "organization", "store", "customer", "session_key",
            "status", "subtotal", "currency", "items", "total_items",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "organization", "subtotal", "created_at", "updated_at",
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id", "order", "product", "variant", "title", "sku",
            "quantity", "unit_price", "total_price", "image_url",
            "created_at",
        ]
        read_only_fields = ["id", "total_price", "created_at"]


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "organization", "store", "customer",
            "status", "payment_status", "subtotal", "tax_amount",
            "shipping_amount", "discount_amount", "total", "currency",
            "customer_email", "customer_name", "item_count",
            "source", "created_at", "updated_at",
        ]

    def get_customer_name(self, obj) -> str:
        return f"{obj.customer_first_name} {obj.customer_last_name}".strip()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "organization", "store", "customer",
            "status", "payment_status",
            "subtotal", "tax_amount", "shipping_amount",
            "discount_amount", "total", "currency",
            "customer_email", "customer_first_name", "customer_last_name",
            "customer_phone", "customer_name",
            "shipping_address_line1", "shipping_address_line2",
            "shipping_city", "shipping_state", "shipping_postal_code",
            "shipping_country",
            "billing_address_line1", "billing_address_line2",
            "billing_city", "billing_state", "billing_postal_code",
            "billing_country",
            "customer_notes", "internal_notes",
            "tracking_number", "tracking_url",
            "shipped_at", "delivered_at",
            "source", "ip_address", "user_agent",
            "items", "item_count",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "order_number", "organization", "created_at", "updated_at",
        ]

    def get_customer_name(self, obj) -> str:
        return f"{obj.customer_first_name} {obj.customer_last_name}".strip()


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(source="changed_by.email", read_only=True, default="")

    class Meta:
        model = OrderStatusHistory
        fields = [
            "id", "order", "from_status", "to_status",
            "changed_by", "changed_by_email", "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
