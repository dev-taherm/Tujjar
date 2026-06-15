import pytest
from rest_framework import status

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


class TestSearchAPI:
    def test_search_endpoint(self, api_client):
        from apps.search.models import SearchIndex

        user, org, store, token = create_org_with_owner_and_store("search-global@example.com")
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

        user, org, store, token = create_org_with_owner_and_store("search-suggest@example.com")
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
        user, org, store, token = create_org_with_owner_and_store("search-empty@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/search/index/search_suggestions/", {"q": ""})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["suggestions"] == []
