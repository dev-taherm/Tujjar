import pytest
from decimal import Decimal
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authenticate_client(api_client):
    def _authenticate(user):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        return api_client
    return _authenticate


@pytest.fixture
def user(db):
    from apps.authentication.models import User
    return User.objects.create_user(
        email="test@example.com", password="testpass123",
        first_name="Test", last_name="User", is_verified=True,
    )


@pytest.fixture
def store(db, organization):
    from apps.stores.models import Store
    return Store.objects.create(
        organization=organization, name="Test Store",
        slug="test-store",
    )


@pytest.fixture
def organization(user, db):
    from apps.organizations.models import Organization, OrganizationMembership, Role
    org = Organization.objects.create(name="Test Org", slug="test-org")
    role, _ = Role.objects.get_or_create(
        slug="owner", organization=None,
        defaults={"name": "Owner", "is_system": True},
    )
    OrganizationMembership.objects.create(
        user=user, organization=org, role=role, is_accepted=True,
    )
    return org


@pytest.fixture
def product(db, organization, store):
    from apps.products.models import Product
    return Product.objects.create(
        organization=organization, store=store,
        title="Test Product", slug="test-product",
        description="A test product", product_type="physical",
        status="active", price=Decimal("29.99"), sku="TST-001",
    )
