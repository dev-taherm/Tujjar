from __future__ import annotations

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


class Customer(UUIDModel, TimeStampedModel):
    """Customer linked to a store, optionally linked to a User account."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="customers",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="customers",
    )
    user = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customer_profiles",
    )
    email = models.EmailField(db_index=True)
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    company = models.CharField(max_length=255, blank=True, default="")

    # Address (default shipping)
    address_line1 = models.CharField(max_length=255, blank=True, default="")
    address_line2 = models.CharField(max_length=255, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=100, blank=True, default="")
    postal_code = models.CharField(max_length=20, blank=True, default="")
    country = models.CharField(max_length=2, blank=True, default="")  # ISO 3166-1 alpha-2

    # Stats
    orders_count = models.PositiveIntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    loyalty_points = models.IntegerField(default=0)
    last_order_date = models.DateTimeField(null=True, blank=True)

    # Metadata
    tags = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, default="")
    is_verified = models.BooleanField(default=False)

    class Meta:
        unique_together = ["store", "email"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "store"]),
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} <{self.email}>".strip()

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class Address(UUIDModel, TimeStampedModel):
    """Shipping/billing address belonging to a customer."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    label = models.CharField(
        max_length=100,
        help_text="e.g. Home, Work, etc.",
    )
    first_name = models.CharField(max_length=100, blank=True, default="")
    last_name = models.CharField(max_length=100, blank=True, default="")
    company = models.CharField(max_length=200, blank=True, default="")
    phone = models.CharField(max_length=50, blank=True, default="")
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, default="")
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, default="")
    postal_code = models.CharField(max_length=20, blank=True, default="")
    country = models.CharField(max_length=2)  # ISO 3166-1 alpha-2
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_default", "label"]
        indexes = [
            models.Index(fields=["organization", "store", "customer"]),
        ]

    def __str__(self) -> str:
        return f"{self.label}: {self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(
                customer_id=self.customer_id,
                store_id=self.store_id,
                is_default=True,
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class WishlistItem(UUIDModel, TimeStampedModel):
    """A product saved to a customer's wishlist."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    note = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ["store", "customer", "product"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "store", "customer"]),
        ]

    def __str__(self) -> str:
        return f"{self.customer} → {self.product}"


class Review(UUIDModel, TimeStampedModel):
    """Product review submitted by a customer."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviews",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    order_item = models.ForeignKey(
        "orders.OrderItem",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_approved = models.BooleanField(default=True)
    helpful_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ["store", "customer", "product"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "store", "product", "is_approved"]),
        ]

    def __str__(self) -> str:
        return f"{self.rating}★ {self.title}"


class LoyaltyTransaction(UUIDModel, TimeStampedModel):
    """Audit log for loyalty point changes."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    TYPE_CHOICES = [
        ("earned", "Earned"),
        ("adjusted", "Adjusted"),
        ("redeemed", "Redeemed"),
        ("expired", "Expired"),
    ]

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="loyalty_transactions",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="loyalty_transactions",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="loyalty_transactions",
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    points = models.IntegerField(
        help_text="Positive = earned, negative = spent/adjusted",
    )
    balance = models.IntegerField(
        help_text="Running balance after this transaction",
    )
    description = models.CharField(max_length=255)
    reference_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="Related order ID if earned from purchase",
    )
    created_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loyalty_adjustments",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "store", "customer"]),
        ]

    def __str__(self) -> str:
        return f"{self.type}: {self.points} pts (balance: {self.balance})"


class SavedCart(UUIDModel, TimeStampedModel):
    """A named collection of products a customer saved for later."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="saved_carts",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="saved_carts",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="saved_carts",
    )
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["organization", "store", "customer"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.customer})"

    @property
    def item_count(self) -> int:
        return self.items.count()


class SavedCartItem(UUIDModel):
    """An item within a saved cart."""

    saved_cart = models.ForeignKey(
        SavedCart,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
    )
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        unique_together = ["saved_cart", "product", "variant"]

    def __str__(self) -> str:
        return f"{self.product} × {self.quantity}"
