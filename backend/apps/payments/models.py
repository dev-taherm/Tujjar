from __future__ import annotations

from django.db import models

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


class Payment(UUIDModel, TimeStampedModel):
    """A payment attempt/record against an order.

    `provider_ref` stores the provider's identifier (e.g. the Stripe
    Checkout Session or PaymentIntent id) so webhook events can be matched
    back to a payment record and order.
    """

    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        COD = "cod", "Cash on delivery"
        BANK_TRANSFER = "bank_transfer", "Bank transfer"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="payments",
    )
    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="payments"
    )
    provider = models.CharField(max_length=20, choices=Provider.choices)
    provider_ref = models.CharField(max_length=255, blank=True, default="", db_index=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    event_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["provider", "provider_ref"]),
        ]

    def __str__(self) -> str:
        return f"{self.provider} {self.amount} for {self.order.order_number} ({self.status})"
