from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class MarketplaceListing(UUIDModel, TimeStampedModel):
    """A theme listed on the marketplace by a developer."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_REVIEW = "pending_review", "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        SUSPENDED = "suspended", "Suspended"

    class PricingType(models.TextChoices):
        FREE = "free", "Free"
        PAID = "paid", "Paid"

    developer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_listings",
    )
    theme = models.OneToOneField(
        "themes.Theme",
        on_delete=models.CASCADE,
        related_name="marketplace_listing",
    )
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    pricing_type = models.CharField(
        max_length=20, choices=PricingType.choices, default=PricingType.FREE
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    category = models.CharField(max_length=100, blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    screenshots = models.JSONField(default=list, blank=True)
    demo_url = models.URLField(blank=True, default="")
    download_count = models.PositiveIntegerField(default=0)
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_featured", "-download_count"]
        indexes = [
            models.Index(fields=["status", "is_featured"]),
            models.Index(fields=["status", "category"]),
            models.Index(fields=["status", "pricing_type"]),
            models.Index(fields=["developer", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} by {self.developer}"


class MarketplaceReview(UUIDModel, TimeStampedModel):
    """Review for a marketplace listing."""

    listing = models.ForeignKey(
        MarketplaceListing,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default="")
    helpful_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ["listing", "user"]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Review: {self.title} ({self.rating}/5)"


class MarketplaceOrder(UUIDModel, TimeStampedModel):
    """Purchase of a paid theme from the marketplace."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        REFUNDED = "refunded", "Refunded"

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_orders",
    )
    listing = models.ForeignKey(
        MarketplaceListing,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    external_payment_id = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Order: {self.buyer} -> {self.listing} (${self.amount})"
