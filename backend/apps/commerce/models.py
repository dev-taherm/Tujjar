from __future__ import annotations

from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel

ZERO = Decimal("0")


class Discount(UUIDModel, TimeStampedModel):
    """Discount / coupon code.

    Types:
        percentage    — X% off the items subtotal.
        fixed         — flat currency amount off the items subtotal.
        free_shipping — shipping cost is waived (amount applies to shipping).
    """

    class Type(models.TextChoices):
        PERCENTAGE = "percentage", "Percentage"
        FIXED = "fixed", "Fixed amount"
        FREE_SHIPPING = "free_shipping", "Free shipping"

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="discounts",
    )
    code = models.CharField(max_length=50, db_index=True)
    description = models.CharField(max_length=255, blank=True, default="")
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.PERCENTAGE)
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=ZERO,
        validators=[MinValueValidator(ZERO)],
        help_text="Percentage (0-100) or flat amount depending on type.",
    )
    currency = models.CharField(max_length=3, default="USD")

    # Eligibility
    min_subtotal = models.DecimalField(
        max_digits=10, decimal_places=2, default=ZERO, validators=[MinValueValidator(ZERO)]
    )
    max_uses = models.PositiveIntegerField(
        null=True, blank=True, help_text="Total redemption limit (empty = unlimited)."
    )
    used_count = models.PositiveIntegerField(default=0)
    max_uses_per_customer = models.PositiveIntegerField(
        null=True, blank=True, help_text="Per-customer limit (empty = unlimited)."
    )

    # Validity window
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)

    applies_to_all_products = models.BooleanField(default=True)
    products = models.ManyToManyField(
        "products.Product", blank=True, related_name="discounts"
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "code"],
                name="unique_discount_code_per_org",
            ),
        ]
        indexes = [
            models.Index(fields=["organization", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} ({self.type})"

    # ------------------------------------------------------------------
    # Validation & computation
    # ------------------------------------------------------------------

    def is_valid_now(self, *, subtotal: Decimal = ZERO, now=None) -> bool:
        """Whether this discount can currently be applied to the given subtotal."""
        now = now or timezone.now()
        if not self.is_active:
            return False
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        return subtotal >= self.min_subtotal

    def compute_amount(self, subtotal: Decimal) -> Decimal:
        """Discount amount for the items subtotal (never exceeds the subtotal)."""
        if self.type == self.Type.PERCENTAGE:
            amount = (subtotal * self.value / Decimal("100")).quantize(Decimal("0.01"))
        elif self.type == self.Type.FIXED:
            amount = self.value
        else:  # free_shipping — no reduction of the items subtotal
            amount = ZERO
        return min(amount, subtotal)


class TaxRate(UUIDModel, TimeStampedModel):
    """Tax rate for a region.

    Match priority: postal_code > state > country > default.
    `inclusive` means prices already contain the tax (VAT-style); the tax
    amount is then derived from the discounted subtotal rather than added.
    """

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="tax_rates",
    )
    name = models.CharField(max_length=100)
    rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=ZERO,
        validators=[MinValueValidator(ZERO)],
        help_text="Percentage, e.g. 15.00 for 15% VAT.",
    )
    country = models.CharField(max_length=2, blank=True, default="")
    state = models.CharField(max_length=100, blank=True, default="")
    postal_code = models.CharField(max_length=20, blank=True, default="")
    is_default = models.BooleanField(default=False)
    inclusive = models.BooleanField(
        default=False, help_text="Prices include tax (VAT-style)."
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "is_active"]),
        ]

    def __str__(self) -> str:
        scope = self.postal_code or self.state or self.country or "default"
        return f"{self.name} ({scope}) @ {self.rate}%"

    def specificity(self) -> int:
        """Higher wins when several rates match the same address."""
        score = 0
        if self.country:
            score += 1
        if self.state:
            score += 2
        if self.postal_code:
            score += 4
        if self.is_default:
            score += 0
        return score

    def matches(self, *, country: str = "", state: str = "", postal_code: str = "") -> bool:
        country = (country or "").upper()
        postal_code = (postal_code or "").upper()
        return (
            (not self.country or self.country.upper() == country)
            and (not self.state or self.state.lower() == (state or "").lower())
            and (not self.postal_code or self.postal_code.upper() == postal_code)
        )


class ShippingZone(UUIDModel, TimeStampedModel):
    """Group of countries a set of shipping rates applies to.

    `countries` is a comma-separated list of ISO-3166 alpha-2 codes; empty
    means the zone covers every country (rest of world).
    """

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="shipping_zones",
    )
    name = models.CharField(max_length=100)
    countries = models.CharField(max_length=2000, blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["organization", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.name

    def country_list(self) -> list[str]:
        return [c.strip().upper() for c in self.countries.split(",") if c.strip()]

    def covers(self, country: str) -> bool:
        codes = self.country_list()
        if not codes:
            return True  # rest of world
        return (country or "").upper() in codes


class ShippingRate(UUIDModel, TimeStampedModel):
    """A shipping option inside a zone.

    pricing_type:
        flat        — fixed `price`.
        percentage  — percentage of the (discounted) subtotal.
    """

    class PricingType(models.TextChoices):
        FLAT = "flat", "Flat rate"
        PERCENTAGE = "percentage", "Percentage of subtotal"

    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name="rates")
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True, default="")
    pricing_type = models.CharField(
        max_length=20, choices=PricingType.choices, default=PricingType.FLAT
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2, default=ZERO, validators=[MinValueValidator(ZERO)]
    )
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(ZERO)],
        help_text="Only used when pricing_type=percentage.",
    )
    min_order_subtotal = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    max_order_subtotal = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    free_over = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Shipping is free when the subtotal reaches this amount.",
    )
    transit_time = models.CharField(max_length=100, blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["price"]
        indexes = [
            models.Index(fields=["zone", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.zone.name})"

    def is_available(self, subtotal: Decimal) -> bool:
        return (
            self.is_active
            and (self.min_order_subtotal is None or subtotal >= self.min_order_subtotal)
            and (self.max_order_subtotal is None or subtotal <= self.max_order_subtotal)
        )

    def compute_cost(self, subtotal: Decimal) -> Decimal:
        if self.free_over is not None and subtotal >= self.free_over:
            return ZERO
        if self.pricing_type == self.PricingType.PERCENTAGE and self.percentage is not None:
            return (subtotal * self.percentage / Decimal("100")).quantize(Decimal("0.01"))
        return self.price


class Refund(UUIDModel, TimeStampedModel):
    """Refund against an order (full or partial)."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="refunds",
    )
    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="refunds"
    )
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(ZERO)]
    )
    reason = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    restock = models.BooleanField(
        default=False, help_text="Return refunded items to inventory."
    )
    processed_by = models.ForeignKey(
        "authentication.User", on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order"]),
        ]

    def __str__(self) -> str:
        return f"Refund {self.amount} for {self.order.order_number}"
