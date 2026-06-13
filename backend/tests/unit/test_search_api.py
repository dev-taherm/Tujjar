import pytest
from rest_framework import status

pytestmark = pytest.mark.django_db


def _setup(api_client, email="search-test@example.com"):
    from apps.authentication.models import User
    from apps.organizations.models import Organization, OrganizationMembership, Role
    from apps.stores.models import Store

    user = User.objects.create_user(email=email, password="testpass123", is_verified=True)
    org = Organization.objects.create(name="Search Org", slug=f"org-{email.split('@')[0]}")
    role, _ = Role.objects.get_or_create(slug="owner", organization=None, defaults={"name": "Owner", "is_system": True})
    OrganizationMembership.objects.create(user=user, organization=org, role=role, is_accepted=True)
    store = Store.objects.create(organization=org, name="Search Store", slug=f"store-{email.split('@')[0]}")

    response = api_client.post("/api/v1/auth/login/", {"email": email, "password": "testpass123"})
    return response.data["access"], org, store


class TestSearchAPI:
    def test_search_endpoint(self, api_client):
        from apps.search.models import SearchIndex

        token, org, store = _setup(api_client, "search-global@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        SearchIndex.objects.create(
            organization=org, store=store,
            entity_type="product", entity_id="00000000-0000-0000-0000-000000000001",
            title="Wireless Mouse", description="A wireless bluetooth mouse",
        )
        response = api_client.post("/api/v1/search/index/search/", {
            "q": "mouse",
        }, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

    def test_search_suggestions(self, api_client):
        from apps.search.models import SearchIndex

        token, org, store = _setup(api_client, "search-suggest@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        SearchIndex.objects.create(
            organization=org, store=store,
            entity_type="product", entity_id="00000000-0000-0000-0000-000000000002",
            title="USB Keyboard", description="Mechanical keyboard",
        )
        response = api_client.get("/api/v1/search/index/search_suggestions/", {"q": "key"})
        assert response.status_code == status.HTTP_200_OK
        assert "suggestions" in response.data

    def test_search_empty_query(self, api_client):
        token, org, store = _setup(api_client, "search-empty@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/search/index/search_suggestions/", {"q": ""})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["suggestions"] == []
