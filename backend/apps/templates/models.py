from __future__ import annotations

from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class Template(UUIDModel, TimeStampedModel):
    """A complete store template: theme + pages + navigation + footer + demo content."""

    CATEGORY_CHOICES = [
        ("fashion", "Fashion"),
        ("electronics", "Electronics"),
        ("restaurant", "Restaurant & Cafe"),
        ("pharmacy", "Pharmacy & Medical"),
        ("furniture", "Furniture & Home Decor"),
        ("general", "General"),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default="")
    version = models.CharField(max_length=50, default="1.0.0")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="general")
    author = models.CharField(max_length=255, default="Tujjar")
    thumbnail = models.CharField(max_length=512, blank=True, default="")
    preview_images = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    is_system = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)

    # Theme config
    config = models.JSONField(default=dict, blank=True)
    presets = models.JSONField(default=list, blank=True)

    # Page definitions
    pages = models.JSONField(default=list, blank=True)

    # Navigation and footer
    navigation = models.JSONField(default=dict, blank=True)
    footer = models.JSONField(default=dict, blank=True)

    # SEO defaults
    seo_defaults = models.JSONField(default=dict, blank=True)

    # Demo content (collections, categories)
    demo_content = models.JSONField(default=dict, blank=True)

    # Store settings defaults
    store_settings = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["is_system"]),
        ]

    def __str__(self):
        return f"{self.name} v{self.version}"
