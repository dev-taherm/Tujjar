from __future__ import annotations

import uuid

from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


class OrderTransitionError(Exception):
    """Raised when an invalid order status transition is attempted."""

    pass


# Valid order status transitions
VALID_ORDER_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["processing", "cancelled"],
    "processing": ["shipped", "cancelled"],
    "shipped": ["delivered"],
    "delivered": ["refunded"],
    "cancelled": [],
    "refunded": [],
}


class Cart(UUIDModel, TimeStampedModel):
    """Shopping cart for a customer/session."""

    objects = TenantManager()
    unscoped = UnscopedManager()

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
        indexes = [
            models.Index(fields=["organization", "store"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Cart {self.id} ({self.status})"

    def recalculate(self) -> None:
        """Recalculate cart subtotal from items."""
        from django.db.models import F, Sum

        result = self.items.aggregate(total=Sum(F("quantity") * F("unit_price")))
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

    objects = TenantManager()
    unscoped = UnscopedManager()

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
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default="pending")
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
        indexes = [
            models.Index(fields=["organization", "store"]),
            models.Index(fields=["status"]),
            models.Index(fields=["payment_status"]),
            models.Index(fields=["organization", "store", "status"]),
            models.Index(fields=["customer_email"]),
        ]

    def __str__(self) -> str:
        return f"Order {self.order_number}"

    def save(self, *args, **kwargs) -> None:
        if not self.order_number:
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def transition_status(self, new_status: str, changed_by=None, notes: str = "") -> None:
        """Transition to a new status with validation and history tracking."""
        valid = VALID_ORDER_TRANSITIONS.get(self.status, [])
        if new_status not in valid:
            raise OrderTransitionError(
                f"Cannot transition from '{self.status}' to '{new_status}'. "
                f"Valid transitions: {valid}"
            )
        old_status = self.status
        self.status = new_status
        update_fields = ["status", "updated_at"]
        if new_status == "shipped":
            self.shipped_at = timezone.now()
            update_fields.append("shipped_at")
        elif new_status == "delivered":
            self.delivered_at = timezone.now()
            update_fields.append("delivered_at")
        self.save(update_fields=update_fields)
        OrderStatusHistory.objects.create(
            order=self,
            from_status=old_status,
            to_status=new_status,
            changed_by=changed_by,
            notes=notes,
        )

    def recalculate(self) -> None:
        """Recalculate order totals from items."""
        from django.db.models import F, Sum

        result = self.items.aggregate(items_total=Sum(F("quantity") * F("unit_price")))
        self.subtotal = result["items_total"] or 0
        self.total = self.subtotal + self.tax_amount + self.shipping_amount - self.discount_amount
        self.save(update_fields=["subtotal", "total", "updated_at"])

    @property
    def item_count(self) -> int:
        return self.items.aggregate(total=models.Sum("quantity"))["total"] or 0

    def cancel(self, changed_by=None, notes: str = "") -> None:
        """Cancel order and restore inventory atomically."""
        with transaction.atomic():
            from apps.products.models import Product

            old_status = self.status
            self.status = "cancelled"
            self.save(update_fields=["status", "updated_at"])
            # Restore inventory for all items
            for item in self.items.select_related("product").all():
                if item.product and item.product.track_inventory:
                    Product.objects.filter(id=item.product.id).update(
                        inventory_quantity=models.F("inventory_quantity") + item.quantity,
                        total_sold=models.F("total_sold") - item.quantity,
                        total_revenue=models.F("total_revenue") - item.total_price,
                    )
            OrderStatusHistory.objects.create(
                order=self,
                from_status=old_status,
                to_status="cancelled",
                changed_by=changed_by,
                notes=notes,
            )


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


class OrderStatusHistory(UUIDModel, TimeStampedModel):
    """Tracks every status change on an order."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.order.order_number}: {self.from_status} → {self.to_status}"
