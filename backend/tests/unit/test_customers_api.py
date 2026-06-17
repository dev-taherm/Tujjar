import pytest
from rest_framework import status

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


class TestCustomerCRUD:
    def test_create_customer(self, api_client):

        user, org, store, token = create_org_with_owner_and_store("create-cust@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/customers/customers/",
            {
                "store": str(store.id),
                "email": "new-customer@test.com",
                "first_name": "New",
                "last_name": "Customer",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "new-customer@test.com"

    def test_list_customers(self, api_client):
        from apps.customers.models import Customer

        user, org, store, token = create_org_with_owner_and_store("list-cust@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Customer.objects.create(organization=org, store=store, email="a@test.com", first_name="A")
        Customer.objects.create(organization=org, store=store, email="b@test.com", first_name="B")

        response = api_client.get("/api/v1/customers/customers/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 2

    def test_search_customers(self, api_client):
        from apps.customers.models import Customer

        user, org, store, token = create_org_with_owner_and_store("search-cust@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Customer.objects.create(
            organization=org, store=store, email="findme@test.com", first_name="Findable"
        )

        response = api_client.get("/api/v1/customers/customers/", {"search": "findme"})
        assert response.status_code == status.HTTP_200_OK
