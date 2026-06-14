from __future__ import annotations


from django.core.validators import MinValueValidator
from django.db import models

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


class Category(UUIDModel, TimeStampedModel):
    """Hierarchical product category."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="categories",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="categories",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, default="")
    image = models.URLField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        unique_together = ["store", "slug"]
        ordering = ["sort_order", "name"]
        indexes = [
            models.Index(fields=["organization", "is_active"]),
            models.Index(fields=["organization", "store"]),
        ]

    def __str__(self) -> str:
        return self.name


class Collection(UUIDModel, TimeStampedModel):
    """Curated group of products."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="collections",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="collections",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, default="")
    image = models.URLField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    products = models.ManyToManyField(
        "products.Product",
        blank=True,
        related_name="collection_set",
    )

    class Meta:
        unique_together = ["store", "slug"]
        ordering = ["sort_order", "name"]
        indexes = [
            models.Index(fields=["organization", "is_active"]),
            models.Index(fields=["organization", "store"]),
        ]

    def __str__(self) -> str:
        return self.name


class Product(UUIDModel, TimeStampedModel):
    """Core product model."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    PRODUCT_TYPE_CHOICES = [
        ("physical", "Physical"),
        ("digital", "Digital"),
        ("service", "Service"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="products",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="products",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, default="")
    product_type = models.CharField(
        max_length=20, choices=PRODUCT_TYPE_CHOICES, default="physical"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="draft"
    )

    # Pricing
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)],
    )
    cost_per_item = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)],
    )

    # Inventory
    sku = models.CharField(max_length=100, blank=True, default="")
    barcode = models.CharField(max_length=100, blank=True, default="")
    track_inventory = models.BooleanField(default=True)
    inventory_quantity = models.IntegerField(default=0)
    allow_backorder = models.BooleanField(default=False)
    low_stock_threshold = models.IntegerField(default=5)

    # Physical
    weight = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    requires_shipping = models.BooleanField(default=True)

    # SEO
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")

    # Tax
    is_taxable = models.BooleanField(default=True)
    tax_code = models.CharField(max_length=50, blank=True, default="")

    # Organization
    categories = models.ManyToManyField(
        Category, blank=True, related_name="products"
    )
    tags = models.JSONField(default=list, blank=True)

    # Stats
    total_sold = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )

    class Meta:
        unique_together = ["store", "slug"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["organization", "store"]),
            models.Index(fields=["store", "status"]),
            models.Index(fields=["status", "track_inventory", "inventory_quantity"]),
            models.Index(fields=["product_type"]),
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def is_in_stock(self) -> bool:
        if not self.track_inventory:
            return True
        return self.inventory_quantity > 0 or self.allow_backorder

    @property
    def is_on_sale(self) -> bool:
        return (
            self.compare_at_price is not None
            and self.compare_at_price > self.price
        )

    @property
    def primary_image(self) -> ProductImage | None:
        return self.images.filter(is_primary=True).first() or self.images.first()


class ProductVariant(UUIDModel, TimeStampedModel):
    """Product variant (size, color, etc.)."""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    title = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, blank=True, default="")
    barcode = models.CharField(max_length=100, blank=True, default="")
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    inventory_quantity = models.IntegerField(default=0)
    track_inventory = models.BooleanField(default=True)
    weight = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    option1 = models.CharField(max_length=100, blank=True, default="")
    option2 = models.CharField(max_length=100, blank=True, default="")
    option3 = models.CharField(max_length=100, blank=True, default="")
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "title"]

    def __str__(self) -> str:
        return f"{self.product.title} - {self.title}"

    @property
    def is_in_stock(self) -> bool:
        if not self.track_inventory:
            return True
        return self.inventory_quantity > 0


class ProductImage(UUIDModel, TimeStampedModel):
    """Product image with position ordering."""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    url = models.URLField()
    alt_text = models.CharField(max_length=255, blank=True, default="")
    position = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["position", "created_at"]
        indexes = [
            models.Index(fields=["product", "is_primary"]),
        ]

    def __str__(self) -> str:
        return f"Image {self.position} for {self.product.title}"
