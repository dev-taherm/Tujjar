from __future__ import annotations

import secrets

from django.conf import settings
from django.db import models

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


class Store(UUIDModel, TimeStampedModel):
    """Store model. Each organization can have multiple stores."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="stores",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    custom_domain = models.CharField(max_length=255, blank=True, null=True, unique=True)
    description = models.TextField(blank=True, default="")
    logo = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="store_logos",
    )
    favicon = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="store_favicons",
    )
    theme = models.ForeignKey(
        "themes.Theme",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stores",
    )
    settings = models.JSONField(default=dict, blank=True)
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")
    og_image = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="store_og_images",
    )
    twitter_card = models.CharField(
        max_length=20,
        choices=[
            ("summary", "Summary"),
            ("summary_large_image", "Summary Large Image"),
        ],
        default="summary_large_image",
    )
    is_active = models.BooleanField(default=True)
    template = models.ForeignKey(
        "templates.Template",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stores",
    )
    navigation = models.JSONField(default=dict, blank=True)
    footer_config = models.JSONField(default=dict, blank=True)
    translations = models.JSONField(
        default=dict, blank=True,
        help_text='Per-locale translations, e.g. {"ar": {"name": "...", "description": "..."}}',
    )

    class Meta:
        unique_together = ["organization", "slug"]
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.organization.name})"

    @property
    def domain(self) -> str:
        if self.custom_domain:
            return self.custom_domain
        return f"{self.slug}.{settings.STORE_DOMAIN}"


class StoreDomain(UUIDModel, TimeStampedModel):
    """Custom domain for a store."""

    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="domains")
    domain = models.CharField(max_length=255, unique=True)
    is_primary = models.BooleanField(default=False)
    verified = models.BooleanField(default=False)
    verification_token = models.CharField(
        max_length=255, default=secrets.token_urlsafe
    )

    class Meta:
        ordering = ["-is_primary", "domain"]

    def __str__(self) -> str:
        return self.domain
