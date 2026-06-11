from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class Plan(UUIDModel, TimeStampedModel):
    """Subscription plan definition."""

    class Interval(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    interval = models.CharField(max_length=20, choices=Interval.choices, default=Interval.MONTHLY)
    trial_days = models.PositiveIntegerField(default=14)
    max_products = models.PositiveIntegerField(default=100)
    max_orders = models.PositiveIntegerField(default=1000)
    max_storage_gb = models.PositiveIntegerField(default=5)
    max_ai_generations = models.PositiveIntegerField(default=50)
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    is_system = models.BooleanField(default=False)

    class Meta:
        ordering = ["price"]

    def __str__(self) -> str:
        return f"{self.name} (${self.price}/{self.interval})"


class Subscription(UUIDModel, TimeStampedModel):
    """Organization subscription to a plan."""

    class Status(models.TextChoices):
        TRIALING = "trialing", "Trialing"
        ACTIVE = "active", "Active"
        PAST_DUE = "past_due", "Past Due"
        CANCELED = "canceled", "Canceled"
        UNPAID = "unpaid", "Unpaid"

    organization = models.OneToOneField(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TRIALING)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at = models.DateTimeField(null=True, blank=True)
    canceled_at = models.DateTimeField(null=True, blank=True)
    trial_start = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)
    external_subscription_id = models.CharField(max_length=255, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.organization} - {self.plan} ({self.status})"


class Invoice(UUIDModel, TimeStampedModel):
    """Invoice for subscription payments."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        OPEN = "open", "Open"
        PAID = "paid", "Paid"
        VOID = "void", "Void"
        UNCOLLECTIBLE = "uncollectible", "Uncollectible"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        related_name="invoices",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    description = models.TextField(blank=True, default="")
    invoice_number = models.CharField(max_length=50, unique=True)
    due_date = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    external_invoice_id = models.CharField(max_length=255, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Invoice {self.invoice_number} - ${self.amount}"


class PaymentMethod(UUIDModel, TimeStampedModel):
    """Saved payment method for an organization."""

    class MethodType(models.TextChoices):
        CARD = "card", "Card"
        BANK_ACCOUNT = "bank_account", "Bank Account"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="payment_methods",
    )
    method_type = models.CharField(max_length=20, choices=MethodType.choices)
    last_four = models.CharField(max_length=4)
    brand = models.CharField(max_length=50, blank=True, default="")
    exp_month = models.PositiveIntegerField(null=True, blank=True)
    exp_year = models.PositiveIntegerField(null=True, blank=True)
    is_default = models.BooleanField(default=False)
    external_payment_method_id = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self) -> str:
        return f"{self.brand} ****{self.last_four}"
