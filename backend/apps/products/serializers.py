from __future__ import annotations

from django.utils.text import slugify
from rest_framework import serializers

from .models import (
    Category,
    Collection,
    InventoryMovement,
    Product,
    ProductImage,
    ProductOption,
    ProductOptionValue,
    ProductVariant,
)


class ProductOptionValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOptionValue
        fields = ["id", "option", "value", "swatch", "sort_order", "created_at"]
        read_only_fields = ["id", "option", "created_at"]


class ProductOptionSerializer(serializers.ModelSerializer):
    values = ProductOptionValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProductOption
        fields = ["id", "product", "name", "position", "values", "created_at"]
        read_only_fields = ["id", "product", "created_at"]


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False)

    class Meta:
        model = Category
        fields = [
            "id",
            "organization",
            "store",
            "parent",
            "name",
            "slug",
            "description",
            "image",
            "is_active",
            "sort_order",
            "seo_title",
            "seo_description",
            "translations",
            "children",
            "product_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def get_children(self, obj) -> list:
        return CategorySerializer(obj.children.all(), many=True).data

    def get_product_count(self, obj) -> int:
        return obj.products.count()

    def validate(self, data):
        if "slug" not in data or not data.get("slug"):
            if "name" in data:
                data["slug"] = slugify(data.get("name", ""))
            elif self.instance:
                data["slug"] = self.instance.slug
        return data


class ProductImageSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "media_asset", "url", "alt_text", "position", "is_primary", "file_url", "created_at"]
        read_only_fields = ["id", "created_at", "file_url"]

    def get_file_url(self, obj) -> str:
        return obj.file_url


class ProductVariantSerializer(serializers.ModelSerializer):
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "product",
            "title",
            "sku",
            "barcode",
            "price",
            "compare_at_price",
            "inventory_quantity",
            "track_inventory",
            "weight",
            "option1",
            "option2",
            "option3",
            "is_active",
            "sort_order",
            "is_in_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "product", "created_at", "updated_at"]


class InventoryMovementSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source="created_by.email", read_only=True, default="")

    class Meta:
        model = InventoryMovement
        fields = [
            "id",
            "product",
            "variant",
            "adjustment",
            "reason",
            "reference",
            "created_by",
            "created_by_email",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = ProductImageSerializer(read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    category_names = serializers.SerializerMethodField()
    variant_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "organization",
            "store",
            "title",
            "slug",
            "product_type",
            "status",
            "price",
            "compare_at_price",
            "sku",
            "track_inventory",
            "inventory_quantity",
            "primary_image",
            "is_in_stock",
            "is_on_sale",
            "category_names",
            "variant_count",
            "total_sold",
            "created_at",
            "updated_at",
        ]

    def get_category_names(self, obj) -> list[str]:
        return list(obj.categories.values_list("name", flat=True))

    def get_variant_count(self, obj) -> int:
        return obj.variants.count()


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    options = ProductOptionSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True,
        write_only=True,
        source="categories",
        required=False,
    )
    is_in_stock = serializers.BooleanField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    slug = serializers.SlugField(required=False)

    class Meta:
        model = Product
        fields = [
            "id",
            "organization",
            "store",
            "title",
            "slug",
            "description",
            "product_type",
            "status",
            "price",
            "compare_at_price",
            "cost_per_item",
            "sku",
            "barcode",
            "track_inventory",
            "inventory_quantity",
            "allow_backorder",
            "low_stock_threshold",
            "weight",
            "requires_shipping",
            "seo_title",
            "seo_description",
            "is_taxable",
            "tax_code",
            "categories",
            "category_ids",
            "tags",
            "images",
            "variants",
            "options",
            "is_in_stock",
            "is_on_sale",
            "translations",
            "total_sold",
            "total_revenue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "total_sold",
            "total_revenue",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        if "slug" not in data or not data.get("slug"):
            if "title" in data:
                data["slug"] = slugify(data.get("title", ""))
            elif self.instance:
                data["slug"] = self.instance.slug
        return data

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and hasattr(request, "org_id") and request.org_id:
            self.fields["category_ids"].child_relation.queryset = Category.objects.filter(
                organization_id=request.org_id
            )


class CollectionSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False)

    class Meta:
        model = Collection
        fields = [
            "id",
            "organization",
            "store",
            "name",
            "slug",
            "description",
            "image",
            "is_active",
            "sort_order",
            "seo_title",
            "seo_description",
            "translations",
            "product_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def get_product_count(self, obj) -> int:
        return obj.products.count()

    def validate(self, data):
        if "slug" not in data or not data.get("slug"):
            if "name" in data:
                data["slug"] = slugify(data.get("name", ""))
            elif self.instance:
                data["slug"] = self.instance.slug
        return data


class CollectionDetailSerializer(serializers.ModelSerializer):
    products = ProductListSerializer(many=True, read_only=True)
    product_ids = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        many=True,
        write_only=True,
        source="products",
        required=False,
    )
    product_count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False)

    class Meta:
        model = Collection
        fields = [
            "id",
            "organization",
            "store",
            "name",
            "slug",
            "description",
            "image",
            "is_active",
            "sort_order",
            "seo_title",
            "seo_description",
            "products",
            "product_ids",
            "product_count",
            "translations",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def get_product_count(self, obj) -> int:
        return obj.products.count()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and hasattr(request, "org_id") and request.org_id:
            self.fields["product_ids"].child_relation.queryset = Product.objects.filter(
                organization_id=request.org_id
            )

    def validate(self, data):
        if "slug" not in data or not data.get("slug"):
            if "name" in data:
                data["slug"] = slugify(data.get("name", ""))
            elif self.instance:
                data["slug"] = self.instance.slug
        return data
