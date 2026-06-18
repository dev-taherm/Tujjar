from __future__ import annotations

from django.db import models
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.viewsets import TenantViewSet

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
from .serializers import (
    CategorySerializer,
    CollectionDetailSerializer,
    CollectionSerializer,
    InventoryMovementSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
    ProductOptionSerializer,
    ProductOptionValueSerializer,
    ProductVariantSerializer,
)


class CategoryViewSet(TenantViewSet):
    """Category CRUD with hierarchy support."""

    serializer_class = CategorySerializer
    required_permission = "products.create"

    def get_queryset(self):
        qs = Category.objects.prefetch_related("children", "products").filter(
            organization_id=self.request.org_id
        )
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        parent = self.request.query_params.get("parent")
        if parent == "null":
            qs = qs.filter(parent__isnull=True)
        elif parent:
            qs = qs.filter(parent_id=parent)
        return qs

    def perform_create(self, serializer):
        category = serializer.save(organization_id=self.request.org_id)
        self._log_audit(
            action="category.create",
            resource_type="category",
            resource_id=category.id,
            new_value=CategorySerializer(category).data,
        )

    def perform_update(self, serializer):
        old_data = CategorySerializer(serializer.instance).data
        category = serializer.save()
        self._log_audit(
            action="category.update",
            resource_type="category",
            resource_id=category.id,
            old_value=old_data,
            new_value=CategorySerializer(category).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="category.delete",
            resource_type="category",
            resource_id=instance.id,
            old_value=CategorySerializer(instance).data,
        )
        instance.delete()


class CollectionViewSet(TenantViewSet):
    """Collection CRUD with product management."""

    required_permission = "products.create"

    def get_serializer_class(self):
        if self.action in ("retrieve", "update", "partial_update"):
            return CollectionDetailSerializer
        return CollectionSerializer

    def get_queryset(self):
        qs = Collection.objects.filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        collection = serializer.save(organization_id=self.request.org_id)
        self._log_audit(
            action="collection.create",
            resource_type="collection",
            resource_id=collection.id,
            new_value=CollectionSerializer(collection).data,
        )

    def perform_update(self, serializer):
        old_data = CollectionDetailSerializer(serializer.instance).data
        collection = serializer.save()
        self._log_audit(
            action="collection.update",
            resource_type="collection",
            resource_id=collection.id,
            old_value=old_data,
            new_value=CollectionDetailSerializer(collection).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="collection.delete",
            resource_type="collection",
            resource_id=instance.id,
            old_value=CollectionDetailSerializer(instance).data,
        )
        instance.delete()


class ProductViewSet(TenantViewSet):
    """Product CRUD with filtering, search, and inventory management."""

    required_permission = "products.create"

    def get_serializer_class(self):
        if self.action in ("create", "retrieve", "update", "partial_update"):
            return ProductDetailSerializer
        return ProductListSerializer

    def get_queryset(self):
        qs = (
            Product.objects.select_related("store")
            .prefetch_related("categories", "images", "variants", "options__values")
            .filter(organization_id=self.request.org_id)
        )

        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        product_type = self.request.query_params.get("product_type")
        if product_type:
            qs = qs.filter(product_type=product_type)

        category_id = self.request.query_params.get("category")
        if category_id:
            qs = qs.filter(categories__id=category_id)

        collection_id = self.request.query_params.get("collection")
        if collection_id:
            qs = qs.filter(collection_set__id=collection_id)

        min_price = self.request.query_params.get("min_price")
        if min_price:
            qs = qs.filter(price__gte=min_price)

        max_price = self.request.query_params.get("max_price")
        if max_price:
            qs = qs.filter(price__lte=max_price)

        in_stock = self.request.query_params.get("in_stock")
        if in_stock == "true":
            qs = qs.filter(Q(track_inventory=False) | Q(inventory_quantity__gt=0))

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(sku__icontains=search)
                | Q(description__icontains=search)
                | Q(tags__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        product = serializer.save(organization_id=self.request.org_id)
        self._log_audit(
            action="product.create",
            resource_type="product",
            resource_id=product.id,
            new_value=ProductDetailSerializer(product).data,
        )

    def perform_update(self, serializer):
        old_data = ProductDetailSerializer(serializer.instance).data
        product = serializer.save()
        self._log_audit(
            action="product.update",
            resource_type="product",
            resource_id=product.id,
            old_value=old_data,
            new_value=ProductDetailSerializer(product).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="product.delete",
            resource_type="product",
            resource_id=instance.id,
            old_value=ProductDetailSerializer(instance).data,
        )
        instance.delete()

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """Duplicate a product with all its variants, images, and options."""
        product = self.get_object()
        new_product = Product.objects.create(
            organization=product.organization,
            store=product.store,
            title=f"{product.title} (Copy)",
            slug=f"{product.slug}-copy-{product.id}",
            description=product.description,
            product_type=product.product_type,
            status="draft",
            price=product.price,
            compare_at_price=product.compare_at_price,
            cost_per_item=product.cost_per_item,
            sku=f"{product.sku}-copy" if product.sku else "",
            barcode=product.barcode,
            track_inventory=product.track_inventory,
            inventory_quantity=product.inventory_quantity,
            allow_backorder=product.allow_backorder,
            low_stock_threshold=product.low_stock_threshold,
            weight=product.weight,
            requires_shipping=product.requires_shipping,
            seo_title=product.seo_title,
            seo_description=product.seo_description,
            is_taxable=product.is_taxable,
            tax_code=product.tax_code,
            tags=product.tags,
        )
        new_product.categories.set(product.categories.all())

        for image in product.images.all():
            ProductImage.objects.create(
                product=new_product,
                media_asset=image.media_asset,
                url=image.url,
                alt_text=image.alt_text,
                position=image.position,
                is_primary=image.is_primary,
            )

        for variant in product.variants.all():
            ProductVariant.objects.create(
                product=new_product,
                title=variant.title,
                sku=f"{variant.sku}-copy" if variant.sku else "",
                barcode=variant.barcode,
                price=variant.price,
                compare_at_price=variant.compare_at_price,
                inventory_quantity=variant.inventory_quantity,
                track_inventory=variant.track_inventory,
                weight=variant.weight,
                option1=variant.option1,
                option2=variant.option2,
                option3=variant.option3,
                sort_order=variant.sort_order,
            )

        for option in product.options.all():
            new_option = ProductOption.objects.create(
                product=new_product,
                name=option.name,
                position=option.position,
            )
            for value in option.values.all():
                ProductOptionValue.objects.create(
                    option=new_option,
                    value=value.value,
                    swatch=value.swatch,
                    sort_order=value.sort_order,
                )

        self._log_audit(
            action="product.duplicate",
            resource_type="product",
            resource_id=new_product.id,
            new_value=ProductDetailSerializer(new_product).data,
        )

        return Response(
            ProductDetailSerializer(new_product).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="inventory/update")
    def update_inventory(self, request, pk=None):
        """Update inventory quantity for a product and log the movement."""
        product = self.get_object()
        old_quantity = product.inventory_quantity
        adjustment = int(request.data.get("adjustment", 0))
        reason = request.data.get("reason", "adjustment")
        reference = request.data.get("reference", "")
        product.inventory_quantity = max(0, product.inventory_quantity + adjustment)
        product.save(update_fields=["inventory_quantity", "updated_at"])

        InventoryMovement.objects.create(
            product=product,
            adjustment=adjustment,
            reason=reason,
            reference=reference,
            created_by=request.user if request.user.is_authenticated else None,
        )

        self._log_audit(
            action="product.inventory_update",
            resource_type="product",
            resource_id=product.id,
            old_value={"inventory_quantity": old_quantity},
            new_value={"inventory_quantity": product.inventory_quantity},
        )
        return Response(ProductDetailSerializer(product).data)

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        """List products below their low stock threshold."""
        qs = self.get_queryset().filter(
            track_inventory=True,
            inventory_quantity__lte=models.F("low_stock_threshold"),
            status="active",
        )
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class ProductImageViewSet(TenantViewSet):
    """Product image management."""

    serializer_class = ProductImageSerializer
    required_permission = "products.update"

    def get_queryset(self):
        return ProductImage.objects.filter(
            product__organization_id=self.request.org_id,
            product_id=self.kwargs["product_pk"],
        )

    def perform_create(self, serializer):
        product = Product.objects.get(
            id=self.kwargs["product_pk"],
            organization_id=self.request.org_id,
        )
        image = serializer.save(product=product)
        self._log_audit(
            action="product_image.create",
            resource_type="product_image",
            resource_id=image.id,
            new_value=ProductImageSerializer(image).data,
        )

    def perform_update(self, serializer):
        old_data = ProductImageSerializer(serializer.instance).data
        image = serializer.save()
        self._log_audit(
            action="product_image.update",
            resource_type="product_image",
            resource_id=image.id,
            old_value=old_data,
            new_value=ProductImageSerializer(image).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="product_image.delete",
            resource_type="product_image",
            resource_id=instance.id,
            old_value=ProductImageSerializer(instance).data,
        )
        instance.delete()

    @action(detail=True, methods=["post"])
    def set_primary(self, request, pk=None, product_pk=None):
        """Set this image as the primary product image."""
        image = self.get_object()
        ProductImage.objects.filter(product_id=product_pk).update(is_primary=False)
        image.is_primary = True
        image.save(update_fields=["is_primary"])
        self._log_audit(
            action="product_image.set_primary",
            resource_type="product_image",
            resource_id=image.id,
            new_value={"is_primary": True},
        )
        return Response(ProductImageSerializer(image).data)


class ProductVariantViewSet(TenantViewSet):
    """Product variant management."""

    serializer_class = ProductVariantSerializer
    required_permission = "products.update"

    def get_queryset(self):
        return ProductVariant.objects.filter(
            product__organization_id=self.request.org_id,
            product_id=self.kwargs["product_pk"],
        )

    def perform_create(self, serializer):
        product = Product.objects.get(
            id=self.kwargs["product_pk"],
            organization_id=self.request.org_id,
        )
        variant = serializer.save(product=product)
        self._log_audit(
            action="product_variant.create",
            resource_type="product_variant",
            resource_id=variant.id,
            new_value=ProductVariantSerializer(variant).data,
        )

    def perform_update(self, serializer):
        old_data = ProductVariantSerializer(serializer.instance).data
        variant = serializer.save()
        self._log_audit(
            action="product_variant.update",
            resource_type="product_variant",
            resource_id=variant.id,
            old_value=old_data,
            new_value=ProductVariantSerializer(variant).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="product_variant.delete",
            resource_type="product_variant",
            resource_id=instance.id,
            old_value=ProductVariantSerializer(instance).data,
        )
        instance.delete()

    @action(detail=True, methods=["post"], url_path="inventory/update")
    def update_inventory(self, request, pk=None, product_pk=None):
        """Update inventory for a specific variant and log the movement."""
        variant = self.get_object()
        old_quantity = variant.inventory_quantity
        adjustment = int(request.data.get("adjustment", 0))
        reason = request.data.get("reason", "adjustment")
        reference = request.data.get("reference", "")
        variant.inventory_quantity = max(0, variant.inventory_quantity + adjustment)
        variant.save(update_fields=["inventory_quantity", "updated_at"])

        product = Product.objects.get(id=product_pk, organization_id=self.request.org_id)
        InventoryMovement.objects.create(
            product=product,
            variant=variant,
            adjustment=adjustment,
            reason=reason,
            reference=reference,
            created_by=request.user if request.user.is_authenticated else None,
        )

        self._log_audit(
            action="product_variant.inventory_update",
            resource_type="product_variant",
            resource_id=variant.id,
            old_value={"inventory_quantity": old_quantity},
            new_value={"inventory_quantity": variant.inventory_quantity},
        )
        return Response(ProductVariantSerializer(variant).data)


class ProductOptionViewSet(TenantViewSet):
    """Product option management (Color, Size, etc.)."""

    serializer_class = ProductOptionSerializer
    required_permission = "products.update"

    def get_queryset(self):
        return ProductOption.objects.filter(
            product__organization_id=self.request.org_id,
            product_id=self.kwargs["product_pk"],
        ).prefetch_related("values")

    def perform_create(self, serializer):
        product = Product.objects.get(
            id=self.kwargs["product_pk"],
            organization_id=self.request.org_id,
        )
        option = serializer.save(product=product)
        self._log_audit(
            action="product_option.create",
            resource_type="product_option",
            resource_id=option.id,
            new_value=ProductOptionSerializer(option).data,
        )

    def perform_update(self, serializer):
        old_data = ProductOptionSerializer(serializer.instance).data
        option = serializer.save()
        self._log_audit(
            action="product_option.update",
            resource_type="product_option",
            resource_id=option.id,
            old_value=old_data,
            new_value=ProductOptionSerializer(option).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="product_option.delete",
            resource_type="product_option",
            resource_id=instance.id,
            old_value=ProductOptionSerializer(instance).data,
        )
        instance.delete()

    @action(detail=True, methods=["post"], url_path="values")
    def add_value(self, request, pk=None, product_pk=None):
        """Add a value to this option."""
        option = self.get_object()
        serializer = ProductOptionValueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        value = serializer.save(option=option)
        return Response(ProductOptionValueSerializer(value).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"values/(?P<value_pk>[^/.]+)")
    def delete_value(self, request, pk=None, product_pk=None, value_pk=None):
        """Delete a value from this option."""
        option = self.get_object()
        value = option.values.get(id=value_pk)
        value.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InventoryMovementViewSet(TenantViewSet):
    """Read-only inventory movement history."""

    serializer_class = InventoryMovementSerializer
    required_permission = "products.create"

    def get_queryset(self):
        qs = InventoryMovement.objects.select_related("product", "variant", "created_by").filter(
            product__organization_id=self.request.org_id
        )
        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        variant_id = self.request.query_params.get("variant")
        if variant_id:
            qs = qs.filter(variant_id=variant_id)
        reason = self.request.query_params.get("reason")
        if reason:
            qs = qs.filter(reason=reason)
        return qs
