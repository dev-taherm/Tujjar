from __future__ import annotations

import secrets

from django.db import models

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


def generate_webhook_secret() -> str:
    return "whsec_" + secrets.token_urlsafe(32)


class WebhookEndpoint(UUIDModel, TimeStampedModel):
    """A merchant-registered HTTP endpoint that receives signed events."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="webhook_endpoints",
    )
    url = models.URLField(max_length=500)
    secret = models.CharField(
        max_length=100,
        default=generate_webhook_secret,
        help_text="Used to compute the HMAC-SHA256 signature header.",
    )
    events = models.JSONField(
        default=list,
        help_text='Event types to subscribe to. ["*"] subscribes to everything.',
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.url} ({self.organization.slug})"

    def subscribes_to(self, event_type: str) -> bool:
        return "*" in self.events or event_type in self.events


class WebhookDelivery(UUIDModel, TimeStampedModel):
    """One event delivery attempt-tracker per (endpoint, event)."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="webhook_deliveries",
    )
    endpoint = models.ForeignKey(
        WebhookEndpoint, on_delete=models.CASCADE, related_name="deliveries"
    )
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    response_status = models.PositiveIntegerField(null=True, blank=True)
    attempts = models.PositiveIntegerField(default=0)
    error = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["endpoint", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.event_type} → {self.endpoint.url} ({self.status})"
