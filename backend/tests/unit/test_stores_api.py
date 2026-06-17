import pytest
from rest_framework import status

from tests.factories import StoreFactory, create_org_with_owner

pytestmark = pytest.mark.django_db


class TestStoreCRUD:
    def test_create_store(self, api_client):
        user, org, token = create_org_with_owner("create-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/stores/",
            {
                "name": "My New Store",
                "slug": "my-new-store",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_stores(self, api_client):
        user, org, token = create_org_with_owner("list-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        StoreFactory(organization=org, name="Store A", slug="store-a")
        response = api_client.get("/api/v1/stores/")
        assert response.status_code == status.HTTP_200_OK

    def test_update_store_settings(self, api_client):
        user, org, token = create_org_with_owner("update-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        store = StoreFactory(organization=org, name="Settings Store", slug="settings-store")
        response = api_client.patch(
            f"/api/v1/stores/{store.id}/",
            {
                "description": "Updated description",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

    def test_cross_org_store_access_denied(self, api_client):
        from tests.factories import OrganizationFactory, OwnerMembershipFactory, UserFactory

        user1, org1, token1 = create_org_with_owner("cross-store1@example.com")
        user2 = UserFactory(email="cross-store2@example.com")
        org2 = OrganizationFactory(name="Other Org", slug="other-org-store")
        OwnerMembershipFactory(user=user2, organization=org2)
        store2 = StoreFactory(organization=org2, name="Other Store", slug="other-store")

        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
        response = api_client.get(f"/api/v1/stores/{store2.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
