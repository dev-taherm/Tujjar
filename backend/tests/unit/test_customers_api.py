import pytest
from rest_framework import status

pytestmark = pytest.mark.django_db


def _setup(api_client, email="cust-test@example.com"):
    from apps.authentication.models import User
    from apps.organizations.models import Organization, OrganizationMembership, Role
    from apps.stores.models import Store

    user = User.objects.create_user(email=email, password="testpass123", is_verified=True)
    org = Organization.objects.create(name="Cust Test Org", slug=f"org-{email.split('@')[0]}")
    role, _ = Role.objects.get_or_create(slug="owner", organization=None, defaults={"name": "Owner", "is_system": True})
    OrganizationMembership.objects.create(user=user, organization=org, role=role, is_accepted=True)
    store = Store.objects.create(organization=org, name="Cust Store", slug=f"store-{email.split('@')[0]}")

    response = api_client.post("/api/v1/auth/login/", {"email": email, "password": "testpass123"})
    return response.data["access"], org, store


class TestCustomerCRUD:
    def test_create_customer(self, api_client):
        from apps.customers.models import Customer

        token, org, store = _setup(api_client, "create-cust@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post("/api/v1/customers/customers/", {
            "store": str(store.id),
            "email": "new-customer@test.com",
            "first_name": "New",
            "last_name": "Customer",
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "new-customer@test.com"

    def test_list_customers(self, api_client):
        from apps.customers.models import Customer

        token, org, store = _setup(api_client, "list-cust@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Customer.objects.create(organization=org, store=store, email="a@test.com", first_name="A")
        Customer.objects.create(organization=org, store=store, email="b@test.com", first_name="B")

        response = api_client.get("/api/v1/customers/customers/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 2

    def test_search_customers(self, api_client):
        from apps.customers.models import Customer

        token, org, store = _setup(api_client, "search-cust@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Customer.objects.create(organization=org, store=store, email="findme@test.com", first_name="Findable")

        response = api_client.get("/api/v1/customers/customers/", {"search": "findme"})
        assert response.status_code == status.HTTP_200_OK
