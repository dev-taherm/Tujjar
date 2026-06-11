from __future__ import annotations

from django.db import models
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.models import log_action

from .models import Category, Collection, Product, ProductImage, ProductVariant
from .serializers import (
    CategorySerializer,
    CollectionDetailSerializer,
    CollectionSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
    ProductVariantSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    """Category CRUD with hierarchy support."""

    serializer_class = CategorySerializer

    def get_queryset(self):
        qs = Category.objects.filter(organization_id=self.request.org_id)
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
        log_action(
            action="category.create",
            resource_type="category",
            resource_id=category.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            new_value=CategorySerializer(category).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )


class CollectionViewSet(viewsets.ModelViewSet):
    """Collection CRUD with product management."""

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
        log_action(
            action="collection.create",
            resource_type="collection",
            resource_id=collection.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            new_value=CollectionSerializer(collection).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )


class ProductViewSet(viewsets.ModelViewSet):
    """Product CRUD with filtering, search, and inventory management."""

    def get_serializer_class(self):
        if self.action in ("create", "retrieve", "update", "partial_update"):
            return ProductDetailSerializer
        return ProductListSerializer

    def get_queryset(self):
        qs = Product.objects.select_related("store").prefetch_related(
            "categories", "images", "variants"
        ).filter(organization_id=self.request.org_id)

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
        log_action(
            action="product.create",
            resource_type="product",
            resource_id=product.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            new_value=ProductDetailSerializer(product).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """Duplicate a product with all its variants and images."""
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

        return Response(
            ProductDetailSerializer(new_product).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="inventory/update")
    def update_inventory(self, request, pk=None):
        """Update inventory quantity for a product."""
        product = self.get_object()
        adjustment = request.data.get("adjustment", 0)
        product.inventory_quantity = max(0, product.inventory_quantity + int(adjustment))
        product.save(update_fields=["inventory_quantity", "updated_at"])
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


class ProductImageViewSet(viewsets.ModelViewSet):
    """Product image management."""

    serializer_class = ProductImageSerializer

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
        serializer.save(product=product)

    @action(detail=True, methods=["post"])
    def set_primary(self, request, pk=None, product_pk=None):
        """Set this image as the primary product image."""
        image = self.get_object()
        ProductImage.objects.filter(product_id=product_pk).update(is_primary=False)
        image.is_primary = True
        image.save(update_fields=["is_primary"])
        return Response(ProductImageSerializer(image).data)


class ProductVariantViewSet(viewsets.ModelViewSet):
    """Product variant management."""

    serializer_class = ProductVariantSerializer

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
        serializer.save(product=product)
