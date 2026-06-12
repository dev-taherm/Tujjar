from __future__ import annotations

import uuid

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel, UUIDModel


class Cart(UUIDModel, TimeStampedModel):
    """Shopping cart for a customer/session."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="carts",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="carts",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="carts",
    )
    session_key = models.CharField(max_length=255, blank=True, default="", db_index=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("active", "Active"),
            ("abandoned", "Abandoned"),
            ("converted", "Converted"),
        ],
        default="active",
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Cart {self.id} ({self.status})"

    def recalculate(self) -> None:
        """Recalculate cart subtotal from items."""
        from django.db.models import F, Sum

        result = self.items.aggregate(
            total=Sum(F("quantity") * F("unit_price"))
        )
        self.subtotal = result["total"] or 0
        self.save(update_fields=["subtotal", "updated_at"])

    @property
    def total_items(self) -> int:
        return self.items.aggregate(total=models.Sum("quantity"))["total"] or 0


class CartItem(UUIDModel, TimeStampedModel):
    """Individual item in a cart."""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="cart_items"
    )
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )

    class Meta:
        unique_together = ["cart", "product", "variant"]

    def __str__(self) -> str:
        return f"{self.quantity}x {self.product.title}"

    @property
    def line_total(self):
        return self.quantity * self.unit_price


class Order(UUIDModel, TimeStampedModel):
    """Customer order."""

    ORDER_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("authorized", "Authorized"),
        ("paid", "Paid"),
        ("partially_paid", "Partially Paid"),
        ("refunded", "Refunded"),
        ("voided", "Voided"),
    ]

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="orders",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="orders",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    # Order identification
    order_number = models.CharField(max_length=50, unique=True, db_index=True)

    # Status
    status = models.CharField(
        max_length=20, choices=ORDER_STATUS_CHOICES, default="pending"
    )
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )

    # Financials
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")

    # Customer info (denormalized at time of order)
    customer_email = models.EmailField()
    customer_first_name = models.CharField(max_length=150, blank=True, default="")
    customer_last_name = models.CharField(max_length=150, blank=True, default="")
    customer_phone = models.CharField(max_length=30, blank=True, default="")

    # Shipping address
    shipping_address_line1 = models.CharField(max_length=255, blank=True, default="")
    shipping_address_line2 = models.CharField(max_length=255, blank=True, default="")
    shipping_city = models.CharField(max_length=100, blank=True, default="")
    shipping_state = models.CharField(max_length=100, blank=True, default="")
    shipping_postal_code = models.CharField(max_length=20, blank=True, default="")
    shipping_country = models.CharField(max_length=2, blank=True, default="")

    # Billing address
    billing_address_line1 = models.CharField(max_length=255, blank=True, default="")
    billing_address_line2 = models.CharField(max_length=255, blank=True, default="")
    billing_city = models.CharField(max_length=100, blank=True, default="")
    billing_state = models.CharField(max_length=100, blank=True, default="")
    billing_postal_code = models.CharField(max_length=20, blank=True, default="")
    billing_country = models.CharField(max_length=2, blank=True, default="")

    # Notes
    customer_notes = models.TextField(blank=True, default="")
    internal_notes = models.TextField(blank=True, default="")

    # Tracking
    tracking_number = models.CharField(max_length=255, blank=True, default="")
    tracking_url = models.URLField(blank=True, default="")
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Source
    source = models.CharField(max_length=50, blank=True, default="web")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Order {self.order_number}"

    def save(self, *args, **kwargs) -> None:
        if not self.order_number:
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def recalculate(self) -> None:
        """Recalculate order totals from items."""
        from django.db.models import F, Sum

        result = self.items.aggregate(
            items_total=Sum(F("quantity") * F("unit_price"))
        )
        self.subtotal = result["items_total"] or 0
        self.total = self.subtotal + self.tax_amount + self.shipping_amount - self.discount_amount
        self.save(update_fields=["subtotal", "total", "updated_at"])

    @property
    def item_count(self) -> int:
        return self.items.aggregate(total=models.Sum("quantity"))["total"] or 0

    def mark_shipped(self, tracking_number: str = "", tracking_url: str = "") -> None:
        self.status = "shipped"
        self.tracking_number = tracking_number
        self.tracking_url = tracking_url
        self.shipped_at = timezone.now()
        self.save(update_fields=["status", "tracking_number", "tracking_url", "shipped_at", "updated_at"])

    def mark_delivered(self) -> None:
        self.status = "delivered"
        self.delivered_at = timezone.now()
        self.save(update_fields=["status", "delivered_at", "updated_at"])

    def cancel(self) -> None:
        self.status = "cancelled"
        self.save(update_fields=["status", "updated_at"])


class OrderItem(UUIDModel, TimeStampedModel):
    """Line item in an order."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product", on_delete=models.SET_NULL, null=True, related_name="order_items"
    )
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )

    # Denormalized product data at time of order
    title = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, blank=True, default="")
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(blank=True, default="")

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.quantity}x {self.title}"

    def save(self, *args, **kwargs) -> None:
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
