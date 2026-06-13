from __future__ import annotations


from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class Event(UUIDModel, TimeStampedModel):
    """Generic analytics event."""

    class EventType(models.TextChoices):
        PAGE_VIEW = "page_view", "Page View"
        PRODUCT_VIEW = "product_view", "Product View"
        ADD_TO_CART = "add_to_cart", "Add to Cart"
        PURCHASE = "purchase", "Purchase"
        SEARCH = "search", "Search"
        SIGNUP = "signup", "Sign Up"
        NEWSLETTER_SUBSCRIBE = "newsletter_subscribe", "Newsletter Subscribe"
        CLICK = "click", "Click"
        CUSTOM = "custom", "Custom"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="analytics_events",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="analytics_events",
        null=True,
        blank=True,
    )
    event_type = models.CharField(max_length=50, choices=EventType.choices)
    entity_type = models.CharField(max_length=100, blank=True, default="")
    entity_id = models.UUIDField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    session_id = models.CharField(max_length=255, blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    referrer = models.URLField(blank=True, default="")
    url = models.URLField(blank=True, default="")
    visitor_id = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "store", "event_type"]),
            models.Index(fields=["organization", "created_at"]),
            models.Index(fields=["visitor_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.event_type} - {self.entity_type} ({self.created_at})"


class DailyStats(UUIDModel, TimeStampedModel):
    """Pre-aggregated daily statistics per store."""

    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="daily_stats",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="daily_stats",
    )
    date = models.DateField()
    total_orders = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_customers = models.PositiveIntegerField(default=0)
    total_products_sold = models.PositiveIntegerField(default=0)
    total_page_views = models.PositiveIntegerField(default=0)
    total_visitors = models.PositiveIntegerField(default=0)
    total_searches = models.PositiveIntegerField(default=0)
    conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    average_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    top_products = models.JSONField(default=list, blank=True)
    traffic_sources = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-date"]
        unique_together = ["store", "date"]
        indexes = [
            models.Index(fields=["store", "date"]),
            models.Index(fields=["organization", "date"]),
        ]

    def __str__(self) -> str:
        return f"Stats for {self.store} on {self.date}"
