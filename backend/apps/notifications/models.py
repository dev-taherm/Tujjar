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

    def mark_as_read(self) -> None:
        self.is_read = True
        self.save(update_fields=["is_read"])

    @classmethod
    def create_for_user(
        cls,
        user,
        notification_type: str,
        title: str,
        message: str,
        organization=None,
        entity_type: str = "",
        entity_id=None,
        action_url: str = "",
        metadata: dict | None = None,
    ) -> "Notification":
        """Create a notification and optionally send email asynchronously."""
        if not organization:
            membership = user.memberships.filter(is_accepted=True).first()
            if membership:
                organization = membership.organization
            else:
                return None

        pref, _ = NotificationPreference.objects.get_or_create(user=user)
        type_pref_map = {
            "order": pref.order_notifications,
            "product": pref.product_notifications,
            "store": pref.store_notifications,
            "billing": pref.billing_notifications,
            "system": pref.system_notifications,
            "ai": pref.ai_notifications,
        }
        if not type_pref_map.get(notification_type, True):
            return None

        notification = cls.objects.create(
            user=user,
            organization=organization,
            notification_type=notification_type,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=action_url,
            metadata=metadata or {},
        )

        if pref.email_notifications:
            from apps.notifications.tasks import send_notification_email_task
            send_notification_email_task.delay(str(notification.id))

        return notification


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
