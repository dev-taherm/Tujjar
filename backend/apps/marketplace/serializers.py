from __future__ import annotations

from rest_framework import serializers

from apps.marketplace.models import MarketplaceListing, MarketplaceOrder, MarketplaceReview


class MarketplaceListingSerializer(serializers.ModelSerializer):
    developer_name = serializers.CharField(source="developer.full_name", read_only=True)

    class Meta:
        model = MarketplaceListing
        fields = [
            "id",
            "slug",
            "name",
            "description",
            "short_description",
            "status",
            "pricing_type",
            "price",
            "category",
            "tags",
            "screenshots",
            "demo_url",
            "download_count",
            "rating_average",
            "rating_count",
            "is_featured",
            "developer_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "download_count",
            "rating_average",
            "rating_count",
            "is_featured",
            "created_at",
            "updated_at",
        ]


class MarketplaceReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = MarketplaceReview
        fields = [
            "id",
            "rating",
            "title",
            "body",
            "helpful_count",
            "user_name",
            "created_at",
        ]
        read_only_fields = ["id", "helpful_count", "created_at"]


class MarketplaceOrderSerializer(serializers.ModelSerializer):
    buyer_email = serializers.CharField(source="buyer.email", read_only=True)

    class Meta:
        model = MarketplaceOrder
        fields = [
            "id",
            "listing",
            "buyer",
            "buyer_email",
            "amount",
            "status",
            "external_payment_id",
            "created_at",
        ]
        read_only_fields = ["id", "buyer", "amount", "status", "created_at"]
