from __future__ import annotations

from rest_framework import serializers

from .models import Category, Collection, Product, ProductImage, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

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


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text", "position", "is_primary", "created_at"]
        read_only_fields = ["id", "created_at"]


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
        read_only_fields = ["id", "created_at", "updated_at"]


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


class CollectionSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

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
            "translations",
            "product_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def get_product_count(self, obj) -> int:
        return obj.products.count()


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
