from __future__ import annotations

from django.db.models import Q
from rest_framework import viewsets, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.products.models import Product, Category, Collection
from apps.products.serializers import ProductListSerializer, ProductDetailSerializer, CategorySerializer, CollectionSerializer
from apps.stores.models import Store
from apps.pages.models import Page
from apps.themes.models import Theme


@api_view(["GET"])
def storefront_home(request, subdomain=None):
    """Public storefront home page data."""
    store = Store.objects.filter(subdomain=subdomain).first()
    if not store:
        return Response({"error": "Store not found"}, status=404)

    featured_products = Product.objects.filter(
        organization=store.organization,
        status="active",
        is_featured=True,
    )[:8]

    return Response({
        "store": {
            "name": store.name,
            "subdomain": store.subdomain,
            "settings": store.settings,
        },
        "featured_products": ProductListSerializer(featured_products, many=True).data,
    })


class StorefrontProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        subdomain = self.kwargs.get("subdomain")
        store = Store.objects.filter(subdomain=subdomain).first()
        if not store:
            return Product.objects.none()
        qs = Product.objects.filter(organization=store.organization, status="active")
        category = self.request.query_params.get("category")
        collection = self.request.query_params.get("collection")
        search = self.request.query_params.get("search")
        sort = self.request.query_params.get("sort", "-created_at")

        if category:
            qs = qs.filter(categories__slug=category)
        if collection:
            qs = qs.filter(collections__slug=collection)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        valid_sorts = {
            "name": "name",
            "-name": "-name",
            "price": "min_price",
            "-price": "-min_price",
            "created_at": "created_at",
            "-created_at": "-created_at",
        }
        qs = qs.order_by(valid_sorts.get(sort, "-created_at"))
        return qs.distinct()


class StorefrontProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer

    def get_object(self):
        subdomain = self.kwargs.get("subdomain")
        slug = self.kwargs.get("slug")
        store = Store.objects.filter(subdomain=subdomain).first()
        if not store:
            return None
        return Product.objects.filter(
            organization=store.organization,
            slug=slug,
            status="active",
        ).first()


class StorefrontCategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        subdomain = self.kwargs.get("subdomain")
        store = Store.objects.filter(subdomain=subdomain).first()
        if not store:
            return Category.objects.none()
        return Category.objects.filter(organization=store.organization, is_active=True)


class StorefrontCollectionListView(generics.ListAPIView):
    serializer_class = CollectionSerializer

    def get_queryset(self):
        subdomain = self.kwargs.get("subdomain")
        store = Store.objects.filter(subdomain=subdomain).first()
        if not store:
            return Collection.objects.none()
        return Collection.objects.filter(organization=store.organization, is_active=True)


class StorefrontPageView(generics.RetrieveAPIView):
    def get_object(self):
        subdomain = self.kwargs.get("subdomain")
        slug = self.kwargs.get("slug")
        store = Store.objects.filter(subdomain=subdomain).first()
        if not store:
            return None
        return Page.objects.filter(
            organization=store.organization,
            slug=slug,
            status="published",
        ).first()

    def retrieve(self, request, *args, **kwargs):
        page = self.get_object()
        if not page:
            return Response({"error": "Page not found"}, status=404)
        return Response({
            "id": str(page.id),
            "title": page.title,
            "slug": page.slug,
            "content_schema": page.content_schema,
            "seo_title": page.seo_title,
            "seo_description": page.seo_description,
        })
