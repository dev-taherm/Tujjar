from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class Notification(UUIDModel, TimeStampedModel):
    """In-app notification for a user."""

    class NotificationType(models.TextChoices):
        ORDER = "order", "Order"
        PRODUCT = "product", "Product"
        STORE = "store", "Store"
        BILLING = "billing", "Billing"
        SYSTEM = "system", "System"
        AI = "ai", "AI"
        CUSTOM = "custom", "Custom"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(max_length=50, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    entity_type = models.CharField(max_length=100, blank=True, default="")
    entity_id = models.UUIDField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    action_url = models.URLField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["organization", "notification_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.notification_type}: {self.title}"

    @property
    def mark_as_read(self) -> None:
        self.is_read = True
        self.save(update_fields=["is_read"])


class NotificationPreference(UUIDModel, TimeStampedModel):
    """User notification preferences."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )
    order_notifications = models.BooleanField(default=True)
    product_notifications = models.BooleanField(default=True)
    store_notifications = models.BooleanField(default=True)
    billing_notifications = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=True)
    ai_notifications = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "notification preferences"

    def __str__(self) -> str:
        return f"Preferences for {self.user}"
