from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    CollectionViewSet,
    ProductImageViewSet,
    ProductVariantViewSet,
    ProductViewSet,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("collections", CollectionViewSet, basename="collection")
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "products/<uuid:product_pk>/images/",
        ProductImageViewSet.as_view({"get": "list", "post": "create"}),
        name="product-images-list",
    ),
    path(
        "products/<uuid:product_pk>/images/<uuid:pk>/",
        ProductImageViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="product-images-detail",
    ),
    path(
        "products/<uuid:product_pk>/images/<uuid:pk>/set-primary/",
        ProductImageViewSet.as_view({"post": "set_primary"}),
        name="product-images-set-primary",
    ),
    path(
        "products/<uuid:product_pk>/variants/",
        ProductVariantViewSet.as_view({"get": "list", "post": "create"}),
        name="product-variants-list",
    ),
    path(
        "products/<uuid:product_pk>/variants/<uuid:pk>/",
        ProductVariantViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="product-variants-detail",
    ),
]
