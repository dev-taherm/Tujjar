import pytest
from rest_framework import status

pytestmark = pytest.mark.django_db


def _setup(api_client, email="pages-test@example.com"):
    from apps.authentication.models import User
    from apps.organizations.models import Organization, OrganizationMembership, Role
    from apps.stores.models import Store

    user = User.objects.create_user(email=email, password="testpass123", is_verified=True)
    org = Organization.objects.create(name="Pages Org", slug=f"org-{email.split('@')[0]}")
    role, _ = Role.objects.get_or_create(slug="owner", organization=None, defaults={"name": "Owner", "is_system": True})
    OrganizationMembership.objects.create(user=user, organization=org, role=role, is_accepted=True)
    store = Store.objects.create(organization=org, name="Pages Store", slug=f"store-{email.split('@')[0]}")

    response = api_client.post("/api/v1/auth/login/", {"email": email, "password": "testpass123"})
    return response.data["access"], org, store


class TestPageCRUD:
    def test_create_page(self, api_client):
        token, org, store = _setup(api_client, "page-create@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post("/api/v1/pages/", {
            "store": str(store.id),
            "title": "About Us",
            "slug": "about-us",
            "page_type": "custom",
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_pages(self, api_client):
        from apps.pages.models import Page

        token, org, store = _setup(api_client, "page-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Page.objects.create(organization=org, store=store, title="Home", slug="home", page_type="custom")
        response = api_client.get("/api/v1/pages/")
        assert response.status_code == status.HTTP_200_OK

    def test_publish_page(self, api_client):
        from apps.pages.models import Page

        token, org, store = _setup(api_client, "page-publish@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        page = Page.objects.create(organization=org, store=store, title="Draft", slug="draft", page_type="custom")
        response = api_client.post(f"/api/v1/pages/{page.id}/publish/")
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.is_published is True

    def test_section_types(self, api_client):
        token, org, store = _setup(api_client, "page-sections@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/pages/section-types/")
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) > 0

    def test_add_section(self, api_client):
        from apps.pages.models import Page

        token, org, store = _setup(api_client, "page-addsec@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        page = Page.objects.create(
            organization=org, store=store, title="Sections",
            slug="sections-page", page_type="custom",
            content_schema={"sections": []},
        )
        response = api_client.post(f"/api/v1/pages/{page.id}/sections/add/", {
            "type": "hero",
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED
