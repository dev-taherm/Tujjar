from __future__ import annotations

from django.contrib.postgres.search import (
    SearchVectorField,
    TrigramSimilarity,
)
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class SearchIndex(UUIDModel, TimeStampedModel):
    """Full-text search index entry for cross-entity search."""

    class EntityType(models.TextChoices):
        PRODUCT = "product", "Product"
        PAGE = "page", "Page"
        COLLECTION = "collection", "Collection"
        CATEGORY = "category", "Category"
        CUSTOMER = "customer", "Customer"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="search_indices",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="search_indices",
        null=True,
        blank=True,
    )
    entity_type = models.CharField(max_length=50, choices=EntityType.choices)
    entity_id = models.UUIDField()
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    search_vector = SearchVectorField(null=True, blank=True)
    boost = models.FloatField(default=1.0)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ["organization", "entity_type", "entity_id"]
        indexes = [
            models.Index(fields=["organization", "store"]),
            models.Index(fields=["entity_type", "entity_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.entity_type}: {self.title}"


class SearchQuery(UUIDModel, TimeStampedModel):
    """Log of user search queries for analytics."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="search_queries",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="search_queries",
        null=True,
        blank=True,
    )
    query = models.CharField(max_length=500)
    results_count = models.PositiveIntegerField(default=0)
    clicked_entity_type = models.CharField(max_length=50, blank=True, default="")
    clicked_entity_id = models.UUIDField(null=True, blank=True)
    visitor_id = models.CharField(max_length=255, blank=True, default="")
    session_id = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "store", "query"]),
        ]

    def __str__(self) -> str:
        return f"Search: {self.query} ({self.results_count} results)"
