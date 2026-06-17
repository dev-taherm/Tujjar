import pytest
from rest_framework import status

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


class TestPageCRUD:
    def test_create_page(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("page-create@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/pages/",
            {
                "store": str(store.id),
                "title": "About Us",
                "slug": "about-us",
                "page_type": "custom",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_pages(self, api_client):
        from apps.pages.models import Page

        user, org, store, token = create_org_with_owner_and_store("page-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Page.objects.create(
            organization=org, store=store, title="Home", slug="home", page_type="custom"
        )
        response = api_client.get("/api/v1/pages/")
        assert response.status_code == status.HTTP_200_OK

    def test_publish_page(self, api_client):
        from apps.pages.models import Page

        user, org, store, token = create_org_with_owner_and_store("page-publish@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        page = Page.objects.create(
            organization=org, store=store, title="Draft", slug="draft", page_type="custom"
        )
        response = api_client.post(f"/api/v1/pages/{page.id}/publish/")
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.is_published is True

    def test_section_types(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("page-sections@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/pages/section-types/")
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) > 0

    def test_add_section(self, api_client):
        from apps.pages.models import Page

        user, org, store, token = create_org_with_owner_and_store("page-addsec@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        page = Page.objects.create(
            organization=org,
            store=store,
            title="Sections",
            slug="sections-page",
            page_type="custom",
            content_schema={"sections": []},
        )
        response = api_client.post(
            f"/api/v1/pages/{page.id}/sections/add/",
            {
                "type": "hero",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
