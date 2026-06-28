from __future__ import annotations

from rest_framework import serializers

from .models import (
    Address,
    Customer,
    LoyaltyTransaction,
    Review,
    SavedCart,
    SavedCartItem,
    WishlistItem,
)


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "organization",
            "store",
            "user",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "company",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "orders_count",
            "total_spent",
            "loyalty_points",
            "tags",
            "notes",
            "is_verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "orders_count",
            "total_spent",
            "loyalty_points",
            "created_at",
            "updated_at",
        ]


# ---------------------------------------------------------------------------
# Address
# ---------------------------------------------------------------------------


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "organization",
            "store",
            "customer",
            "label",
            "first_name",
            "last_name",
            "company",
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization"]

    def validate(self, attrs):
        if self.instance is None:
            attrs.setdefault("organization_id", self.context["request"].org_id)
        return attrs


# ---------------------------------------------------------------------------
# Wishlist
# ---------------------------------------------------------------------------


class WishlistItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_price = serializers.DecimalField(
        source="product.price",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    product_thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = [
            "id",
            "organization",
            "store",
            "customer",
            "product",
            "product_title",
            "product_price",
            "product_thumbnail_url",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "organization"]

    def get_product_thumbnail_url(self, obj):
        image = obj.product.primary_image
        return image.file_url if image else ""

    def validate(self, attrs):
        if self.instance is None:
            attrs.setdefault("organization_id", self.context["request"].org_id)
        return attrs


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "organization",
            "store",
            "customer",
            "product",
            "order_item",
            "rating",
            "title",
            "body",
            "is_approved",
            "helpful_count",
            "customer_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "helpful_count",
            "customer_name",
        ]

    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.full_name
        return ""

    def validate(self, attrs):
        if self.instance is None:
            attrs.setdefault("organization_id", self.context["request"].org_id)
        return attrs


# ---------------------------------------------------------------------------
# Loyalty
# ---------------------------------------------------------------------------


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.full_name",
        read_only=True,
    )

    class Meta:
        model = LoyaltyTransaction
        fields = [
            "id",
            "organization",
            "store",
            "customer",
            "customer_name",
            "type",
            "points",
            "balance",
            "description",
            "reference_id",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "balance",
            "reference_id",
            "created_by",
        ]


class LoyaltyAdjustSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField()
    points = serializers.IntegerField()
    description = serializers.CharField(max_length=255)

    def validate_points(self, value):
        if value == 0:
            raise serializers.ValidationError("Points cannot be zero.")
        return value

    def validate(self, attrs):
        from .models import Customer as CustomerModel

        try:
            customer = CustomerModel.objects.get(pk=attrs["customer_id"])
        except CustomerModel.DoesNotExist:
            raise serializers.ValidationError({"customer_id": "Customer not found."})
        attrs["customer"] = customer
        return attrs


# ---------------------------------------------------------------------------
# Saved Cart
# ---------------------------------------------------------------------------


class SavedCartItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = SavedCartItem
        fields = [
            "id",
            "saved_cart",
            "product",
            "product_title",
            "product_thumbnail_url",
            "variant",
            "quantity",
            "unit_price",
        ]
        read_only_fields = ["id"]

    def get_product_thumbnail_url(self, obj):
        image = obj.product.primary_image
        return image.file_url if image else ""


class SavedCartSerializer(serializers.ModelSerializer):
    items = SavedCartItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = SavedCart
        fields = [
            "id",
            "organization",
            "store",
            "customer",
            "name",
            "items",
            "item_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization"]

    def validate(self, attrs):
        if self.instance is None:
            attrs.setdefault("organization_id", self.context["request"].org_id)
        return attrs


class SavedCartItemCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)
    unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        default=0,
    )
