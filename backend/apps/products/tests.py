from decimal import Decimal

import pytest
from rest_framework import status
from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


class TestProductCRUD:
    def test_create_product(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/products/",
            {
                "store": str(store.id),
                "title": "New Product",
                "slug": "new-product",
                "description": "A great product",
                "product_type": "physical",
                "status": "active",
                "price": "49.99",
                "sku": "NP-001",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "New Product"
        assert response.data["price"] == "49.99"

    def test_list_products(self, api_client):
        from apps.products.models import Product

        user, org, store, token = create_org_with_owner_and_store("list@example.com")
        Product.objects.create(
            organization=org,
            store=store,
            title="Listed Product",
            slug="listed-product",
            status="active",
            price=Decimal("10.00"),
            sku="LP-001",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1

    def test_retrieve_product(self, api_client):
        from apps.products.models import Product

        user, org, store, token = create_org_with_owner_and_store("retrieve@example.com")
        product = Product.objects.create(
            organization=org,
            store=store,
            title="Retrieved Product",
            slug="retrieved-product",
            status="active",
            price=Decimal("15.00"),
            sku="RP-001",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/products/{product.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Retrieved Product"

    def test_update_product(self, api_client):
        from apps.products.models import Product

        user, org, store, token = create_org_with_owner_and_store("update@example.com")
        product = Product.objects.create(
            organization=org,
            store=store,
            title="Old Title",
            slug="update-product",
            status="active",
            price=Decimal("20.00"),
            sku="UP-001",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/products/{product.id}/",
            {"title": "Updated Product"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Updated Product"

    def test_delete_product(self, api_client):
        from apps.products.models import Product

        user, org, store, token = create_org_with_owner_and_store("delete@example.com")
        product = Product.objects.create(
            organization=org,
            store=store,
            title="Doomed Product",
            slug="delete-product",
            status="active",
            price=Decimal("5.00"),
            sku="DP-001",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(f"/api/v1/products/{product.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_list_products_unauthenticated(self, api_client):
        response = api_client.get("/api/v1/products/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestProductFiltering:
    def _setup(self, email):
        from apps.products.models import Product

        user, org, store, token = create_org_with_owner_and_store(email)
        Product.objects.create(
            organization=org,
            store=store,
            title="Active Product",
            slug=f"active-product-{email.split('@')[0]}",
            status="active",
            price=Decimal("10.00"),
            sku=f"AP-{email[:3]}",
        )
        Product.objects.create(
            organization=org,
            store=store,
            title="Draft Product",
            slug=f"draft-product-{email.split('@')[0]}",
            status="draft",
            price=Decimal("20.00"),
            sku=f"DP-{email[:3]}",
        )
        return token, org

    def test_filter_by_status(self, api_client):
        token, _ = self._setup("filter1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/", {"status": "active"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert all(p["status"] == "active" for p in results)

    def test_search_products(self, api_client):
        token, _ = self._setup("filter2@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/", {"search": "Active"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1


class TestCategoryCRUD:
    def test_create_category(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/products/categories/",
            {
                "store": str(store.id),
                "name": "Electronics",
                "slug": "electronics",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Electronics"

    def test_list_categories(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat2@example.com")
        from apps.products.models import Category

        Category.objects.create(
            organization=org,
            store=store,
            name="Books",
            slug="books",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/categories/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1
