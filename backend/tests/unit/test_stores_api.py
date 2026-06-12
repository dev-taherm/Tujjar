import pytest
from rest_framework import status

pytestmark = pytest.mark.django_db


def _setup(api_client, email="store-test@example.com"):
    from apps.authentication.models import User
    from apps.organizations.models import Organization, OrganizationMembership, Role

    user = User.objects.create_user(email=email, password="testpass123", is_verified=True)
    org = Organization.objects.create(name="Store Test Org", slug=f"org-{email.split('@')[0]}")
    role, _ = Role.objects.get_or_create(slug="owner", organization=None, defaults={"name": "Owner", "is_system": True})
    OrganizationMembership.objects.create(user=user, organization=org, role=role, is_accepted=True)

    response = api_client.post("/api/v1/auth/login/", {"email": email, "password": "testpass123"})
    return response.data["access"], org


class TestStoreCRUD:
    def test_create_store(self, api_client):
        token, org = _setup(api_client, "create-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post("/api/v1/stores/", {
            "name": "My New Store",
            "slug": "my-new-store",
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_stores(self, api_client):
        from apps.stores.models import Store

        token, org = _setup(api_client, "list-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Store.objects.create(organization=org, name="Store A", slug="store-a")
        response = api_client.get("/api/v1/stores/")
        assert response.status_code == status.HTTP_200_OK

    def test_update_store_settings(self, api_client):
        from apps.stores.models import Store

        token, org = _setup(api_client, "update-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        store = Store.objects.create(organization=org, name="Settings Store", slug="settings-store")
        response = api_client.patch(f"/api/v1/stores/{store.id}/", {
            "description": "Updated description",
        }, format="json")
        assert response.status_code == status.HTTP_200_OK

    def test_cross_org_store_access_denied(self, api_client):
        from apps.stores.models import Store
        from apps.authentication.models import User
        from apps.organizations.models import Organization, OrganizationMembership, Role

        token, org1 = _setup(api_client, "cross-store1@example.com")
        user2 = User.objects.create_user(email="cross-store2@example.com", password="testpass123", is_verified=True)
        org2 = Organization.objects.create(name="Other Org", slug="other-org-store")
        role, _ = Role.objects.get_or_create(slug="owner", organization=None, defaults={"name": "Owner", "is_system": True})
        OrganizationMembership.objects.create(user=user2, organization=org2, role=role, is_accepted=True)
        store2 = Store.objects.create(organization=org2, name="Other Store", slug="other-store")

        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/stores/{store2.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
