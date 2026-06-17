from decimal import Decimal

import pytest
from rest_framework import status
from tests.factories import create_org_with_owner

from apps.products.models import Category, Product
from apps.stores.models import Store

pytestmark = pytest.mark.django_db


@pytest.fixture
def storefront_data(db):
    from django.core.cache import cache

    cache.clear()
    user, org, token = create_org_with_owner("storeowner@example.com")
    store = Store.objects.create(
        organization=org,
        name="My Store",
        slug="my-store",
    )
    category = Category.objects.create(
        organization=org,
        store=store,
        name="Electronics",
        slug="electronics",
    )
    product = Product.objects.create(
        organization=org,
        store=store,
        title="Test Widget",
        slug="test-widget",
        description="A fine widget",
        product_type="physical",
        status="active",
        price=Decimal("29.99"),
        sku="TW-001",
    )
    product.categories.add(category)
    Product.objects.create(
        organization=org,
        store=store,
        title="Draft Widget",
        slug="draft-widget",
        description="Not yet live",
        product_type="physical",
        status="draft",
        price=Decimal("15.00"),
        sku="DW-001",
    )
    return {"user": user, "org": org, "store": store, "product": product, "category": category}


class TestStorefrontHome:
    def test_home_valid_slug(self, client, storefront_data):
        response = client.get(f"/api/v1/store/{storefront_data['store'].slug}/")
        assert response.status_code == status.HTTP_200_OK
        assert "store" in response.data
        assert "featured_products" in response.data
        assert response.data["store"]["name"] == "My Store"

    def test_home_invalid_slug(self, client):
        response = client.get("/api/v1/store/nonexistent-store/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_home_only_active_products(self, client, storefront_data):
        response = client.get(f"/api/v1/store/{storefront_data['store'].slug}/")
        assert response.status_code == status.HTTP_200_OK
        slugs = [p["slug"] for p in response.data["featured_products"]]
        assert "draft-widget" not in slugs


class TestStorefrontProductList:
    def test_list_products(self, client, storefront_data):
        slug = storefront_data["store"].slug
        response = client.get(f"/api/v1/store/{slug}/products/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        active_slugs = [p["slug"] for p in results]
        assert "test-widget" in active_slugs
        assert "draft-widget" not in active_slugs

    def test_list_products_invalid_store(self, client):
        response = client.get("/api/v1/store/bad-slug/products/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) == 0

    def test_filter_by_category(self, client, storefront_data):
        slug = storefront_data["store"].slug
        cat_slug = storefront_data["category"].slug
        response = client.get(f"/api/v1/store/{slug}/products/", {"category": cat_slug})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1

    def test_search_products(self, client, storefront_data):
        slug = storefront_data["store"].slug
        response = client.get(f"/api/v1/store/{slug}/products/", {"search": "Widget"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1


class TestStorefrontProductDetail:
    def test_detail_valid_product(self, client, storefront_data):
        slug = storefront_data["store"].slug
        product_slug = storefront_data["product"].slug
        response = client.get(f"/api/v1/store/{slug}/products/{product_slug}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Test Widget"

    def test_detail_invalid_product(self, client, storefront_data):
        slug = storefront_data["store"].slug
        response = client.get(f"/api/v1/store/{slug}/products/no-such-product/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_detail_invalid_store(self, client):
        response = client.get("/api/v1/store/bad-slug/products/any-product/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
