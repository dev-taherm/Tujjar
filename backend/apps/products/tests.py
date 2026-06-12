import pytest
from decimal import Decimal
from rest_framework import status

pytestmark = pytest.mark.django_db


def _ensure_owner_role():
    from apps.organizations.models import Role

    role, _ = Role.objects.get_or_create(
        slug="owner", organization=None,
        defaults={"name": "Owner", "is_system": True},
    )
    return role


class TestProductCRUD:
    def _get_auth_token(self, api_client, email="test@example.com", password="testpass123"):
        from apps.authentication.models import User
        from apps.organizations.models import Organization, OrganizationMembership

        user = User.objects.create_user(
            email=email, password=password, is_verified=True,
        )
        org = Organization.objects.create(name="Test Org", slug=f"org-{email.split('@')[0]}")
        role = _ensure_owner_role()
        OrganizationMembership.objects.create(
            user=user, organization=org, role=role, is_accepted=True,
        )
        response = api_client.post(
            "/api/v1/auth/login/",
            {"email": email, "password": password},
        )
        return response.data["access"], org

    def test_create_product(self, api_client):
        from apps.stores.models import Store

        token, org = self._get_auth_token(api_client, "owner1@example.com")
        store = Store.objects.create(organization=org, name="Store", slug="store-1")
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
        from apps.stores.models import Store

        token, org = self._get_auth_token(api_client, "list@example.com")
        store = Store.objects.create(organization=org, name="LStore", slug="lstore-1")
        Product.objects.create(
            organization=org, store=store,
            title="Listed Product", slug="listed-product",
            status="active", price=Decimal("10.00"), sku="LP-001",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1

    def test_retrieve_product(self, api_client):
        from apps.products.models import Product
        from apps.stores.models import Store

        token, org = self._get_auth_token(api_client, "retrieve@example.com")
        store = Store.objects.create(organization=org, name="RStore", slug="rstore-1")
        product = Product.objects.create(
            organization=org, store=store,
            title="Retrieved Product", slug="retrieved-product",
            status="active", price=Decimal("15.00"), sku="RP-001",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/products/{product.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Retrieved Product"

    def test_update_product(self, api_client):
        from apps.products.models import Product
        from apps.stores.models import Store

        token, org = self._get_auth_token(api_client, "update@example.com")
        store = Store.objects.create(organization=org, name="UStore", slug="ustore-1")
        product = Product.objects.create(
            organization=org, store=store,
            title="Old Title", slug="update-product",
            status="active", price=Decimal("20.00"), sku="UP-001",
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
        from apps.stores.models import Store

        token, org = self._get_auth_token(api_client, "delete@example.com")
        store = Store.objects.create(organization=org, name="DStore", slug="dstore-1")
        product = Product.objects.create(
            organization=org, store=store,
            title="Doomed Product", slug="delete-product",
            status="active", price=Decimal("5.00"), sku="DP-001",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(f"/api/v1/products/{product.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_list_products_unauthenticated(self, api_client):
        response = api_client.get("/api/v1/products/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestProductFiltering:
    def _setup(self, api_client, email):
        from apps.authentication.models import User
        from apps.organizations.models import Organization, OrganizationMembership
        from apps.stores.models import Store
        from apps.products.models import Product

        user = User.objects.create_user(
            email=email, password="testpass123", is_verified=True,
        )
        org = Organization.objects.create(name="Filter Org", slug=f"filter-{email.split('@')[0]}")
        role = _ensure_owner_role()
        OrganizationMembership.objects.create(
            user=user, organization=org, role=role, is_accepted=True,
        )
        store = Store.objects.create(organization=org, name="Filter Store", slug=f"filter-store-{email.split('@')[0]}")
        Product.objects.create(
            organization=org, store=store,
            title="Active Product", slug=f"active-product-{email.split('@')[0]}",
            status="active", price=Decimal("10.00"), sku=f"AP-{email[:3]}",
        )
        Product.objects.create(
            organization=org, store=store,
            title="Draft Product", slug=f"draft-product-{email.split('@')[0]}",
            status="draft", price=Decimal("20.00"), sku=f"DP-{email[:3]}",
        )

        response = api_client.post(
            "/api/v1/auth/login/",
            {"email": email, "password": "testpass123"},
        )
        return response.data["access"], org

    def test_filter_by_status(self, api_client):
        token, _ = self._setup(api_client, "filter1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/", {"status": "active"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert all(p["status"] == "active" for p in results)

    def test_search_products(self, api_client):
        token, _ = self._setup(api_client, "filter2@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/", {"search": "Active"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1


class TestCategoryCRUD:
    def _get_auth_token(self, api_client, email):
        from apps.authentication.models import User
        from apps.organizations.models import Organization, OrganizationMembership
        from apps.stores.models import Store

        user = User.objects.create_user(
            email=email, password="testpass123", is_verified=True,
        )
        org = Organization.objects.create(name="Cat Org", slug=f"cat-{email.split('@')[0]}")
        role = _ensure_owner_role()
        OrganizationMembership.objects.create(
            user=user, organization=org, role=role, is_accepted=True,
        )
        store = Store.objects.create(organization=org, name="Cat Store", slug=f"cat-store-{email.split('@')[0]}")
        response = api_client.post(
            "/api/v1/auth/login/",
            {"email": email, "password": "testpass123"},
        )
        return response.data["access"], org, store

    def test_create_category(self, api_client):
        token, org, store = self._get_auth_token(api_client, "cat1@example.com")
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
        token, org, store = self._get_auth_token(api_client, "cat2@example.com")
        from apps.products.models import Category

        Category.objects.create(
            organization=org, store=store,
            name="Books", slug="books",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/categories/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1
