import pytest
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="test@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
        is_verified=True,
    )


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        email="admin@example.com",
        password="testpass123",
        first_name="Admin",
        last_name="User",
        is_staff=True,
        is_superuser=True,
        is_verified=True,
    )


@pytest.fixture
def auth_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


@pytest.fixture
def staff_tokens(staff_user):
    refresh = RefreshToken.for_user(staff_user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


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
def store(organization, db):
    from apps.stores.models import Store

    return Store.objects.create(
        organization=organization, name="Test Store", slug="test-store",
    )


@pytest.fixture
def product(db, organization, store):
    from apps.products.models import Product
    from decimal import Decimal
    return Product.objects.create(
        organization=organization, store=store,
        title="Test Product", slug="test-product",
        description="A test product", product_type="physical",
        status="active", price=Decimal("29.99"), sku="TST-001",
    )
