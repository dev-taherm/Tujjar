from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    CollectionViewSet,
    InventoryMovementViewSet,
    ProductImageViewSet,
    ProductOptionGlobalViewSet,
    ProductOptionViewSet,
    ProductVariantViewSet,
    ProductViewSet,
)

app_name = "products"

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("collections", CollectionViewSet, basename="collection")
router.register("inventory-movements", InventoryMovementViewSet, basename="inventory-movement")
router.register("options", ProductOptionGlobalViewSet, basename="option-global")
router.register("", ProductViewSet, basename="product")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "<uuid:product_pk>/images/",
        ProductImageViewSet.as_view({"get": "list", "post": "create"}),
        name="product-images-list",
    ),
    path(
        "<uuid:product_pk>/images/<uuid:pk>/",
        ProductImageViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="product-images-detail",
    ),
    path(
        "<uuid:product_pk>/images/<uuid:pk>/set-primary/",
        ProductImageViewSet.as_view({"post": "set_primary"}),
        name="product-images-set-primary",
    ),
    path(
        "<uuid:product_pk>/variants/",
        ProductVariantViewSet.as_view({"get": "list", "post": "create"}),
        name="product-variants-list",
    ),
    path(
        "<uuid:product_pk>/variants/<uuid:pk>/",
        ProductVariantViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="product-variants-detail",
    ),
    path(
        "<uuid:product_pk>/variants/<uuid:pk>/inventory/update/",
        ProductVariantViewSet.as_view({"post": "update_inventory"}),
        name="product-variants-inventory",
    ),
    path(
        "<uuid:product_pk>/options/",
        ProductOptionViewSet.as_view({"get": "list", "post": "create"}),
        name="product-options-list",
    ),
    path(
        "<uuid:product_pk>/options/<uuid:pk>/",
        ProductOptionViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="product-options-detail",
    ),
    path(
        "<uuid:product_pk>/options/<uuid:pk>/values/",
        ProductOptionViewSet.as_view({"post": "add_value"}),
        name="product-options-add-value",
    ),
    path(
        "<uuid:product_pk>/options/<uuid:pk>/values/<uuid:value_pk>/",
        ProductOptionViewSet.as_view({"delete": "delete_value"}),
        name="product-options-delete-value",
    ),
]
