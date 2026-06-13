from django.contrib import admin

from .models import MarketplaceListing, MarketplaceOrder, MarketplaceReview


@admin.register(MarketplaceListing)
class MarketplaceListingAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "developer",
        "slug",
        "status",
        "pricing_type",
        "price",
        "category",
        "download_count",
        "rating_average",
        "rating_count",
        "is_featured",
        "created_at",
    ]
    list_filter = ["status", "pricing_type", "is_featured", "category"]
    search_fields = ["name", "slug", "description", "short_description", "category"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(MarketplaceReview)
class MarketplaceReviewAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "listing",
        "user",
        "rating",
        "body",
        "helpful_count",
        "created_at",
    ]
    list_filter = ["rating"]
    search_fields = ["title", "body", "user__email", "listing__name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(MarketplaceOrder)
class MarketplaceOrderAdmin(admin.ModelAdmin):
    list_display = [
        "buyer",
        "listing",
        "amount",
        "status",
        "external_payment_id",
        "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["buyer__email", "listing__name", "external_payment_id"]
    readonly_fields = ["created_at", "updated_at"]
