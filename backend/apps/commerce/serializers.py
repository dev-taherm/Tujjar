from __future__ import annotations

from rest_framework import serializers

from .models import Discount, Refund, ShippingRate, ShippingZone, TaxRate


class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = [
            "id",
            "code",
            "description",
            "type",
            "value",
            "currency",
            "min_subtotal",
            "max_uses",
            "used_count",
            "max_uses_per_customer",
            "valid_from",
            "valid_until",
            "applies_to_all_products",
            "products",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "used_count", "created_at", "updated_at"]

    def validate_value(self, value):
        discount_type = self.initial_data.get("type", "percentage")
        if discount_type == Discount.Type.PERCENTAGE and value > 100:
            raise serializers.ValidationError("Percentage discounts cannot exceed 100.")
        return value


class TaxRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxRate
        fields = [
            "id",
            "name",
            "rate",
            "country",
            "state",
            "postal_code",
            "is_default",
            "inclusive",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ShippingRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingRate
        fields = [
            "id",
            "zone",
            "name",
            "description",
            "pricing_type",
            "price",
            "percentage",
            "min_order_subtotal",
            "max_order_subtotal",
            "free_over",
            "transit_time",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ShippingZoneSerializer(serializers.ModelSerializer):
    rates = ShippingRateSerializer(many=True, read_only=True)

    class Meta:
        model = ShippingZone
        fields = [
            "id",
            "name",
            "countries",
            "is_active",
            "rates",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class RefundSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)

    class Meta:
        model = Refund
        fields = [
            "id",
            "order",
            "order_number",
            "amount",
            "reason",
            "status",
            "restock",
            "processed_by",
            "created_at",
        ]
        read_only_fields = ["id", "status", "processed_by", "created_at"]
