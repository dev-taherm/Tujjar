from __future__ import annotations

from rest_framework import serializers

from apps.marketplace.models import MarketplaceListing, MarketplaceReview, MarketplaceOrder


class MarketplaceListingSerializer(serializers.ModelSerializer):
    developer_name = serializers.CharField(source="developer.full_name", read_only=True)

    class Meta:
        model = MarketplaceListing
        fields = [
            "id", "slug", "name", "description", "short_description",
            "status", "pricing_type", "price", "category", "tags",
            "screenshots", "demo_url", "download_count",
            "rating_average", "rating_count", "is_featured",
            "developer_name", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "download_count", "rating_average", "rating_count",
            "created_at", "updated_at",
        ]


class MarketplaceReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = MarketplaceReview
        fields = [
            "id", "rating", "title", "body", "helpful_count",
            "user_name", "created_at",
        ]
        read_only_fields = ["id", "helpful_count", "created_at"]


class MarketplaceOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketplaceOrder
        fields = [
            "id", "listing", "amount", "status", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
