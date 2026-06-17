import pytest
from rest_framework import status

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


def _setup(email="tmpl-test@example.com"):
    from apps.templates.models import Template

    user, org, store, token = create_org_with_owner_and_store(email)

    # Seed a template for testing
    template = Template.objects.create(
        name="Test Fashion",
        slug=f"test-fashion-{email.split('@')[0]}",
        description="Test template",
        version="1.0.0",
        category="fashion",
        author="Test",
        is_system=True,
        config={
            "colors": {
                "primary": "#000000",
                "secondary": "#666666",
                "accent": "#ff0000",
                "background": "#ffffff",
                "surface": "#f5f5f5",
                "text": "#111111",
                "textSecondary": "#888888",
                "border": "#dddddd",
                "error": "#ff0000",
                "success": "#00ff00",
                "warning": "#ffff00",
            },
            "typography": {
                "headingFont": "Inter",
                "bodyFont": "Inter",
                "baseFontSize": 16,
                "scale": 1.25,
                "lineHeight": 1.6,
            },
            "spacing": {
                "sectionPaddingY": 80,
                "sectionPaddingX": 24,
                "containerMaxWidth": 1200,
                "gridGap": 24,
            },
            "borderRadius": {"small": 4, "medium": 8, "large": 16, "full": 9999},
            "animations": {"enabled": True, "duration": "normal", "easing": "ease-in-out"},
            "darkMode": {"enabled": False, "default": False, "toggle": False},
        },
        presets=[{"name": "Default", "config": {}}],
        pages=[
            {
                "title": "Home",
                "slug": "",
                "page_type": "homepage",
                "is_published": True,
                "seo_title": "Home",
                "seo_description": "Welcome",
                "sections": [{"type": "hero", "settings": {"title": "Welcome"}}],
            },
            {
                "title": "About",
                "slug": "about",
                "page_type": "custom",
                "is_published": True,
                "sections": [{"type": "rich-text", "settings": {"htmlContent": "<p>About us</p>"}}],
            },
            {
                "title": "Contact",
                "slug": "contact",
                "page_type": "custom",
                "is_published": True,
                "sections": [{"type": "contact", "settings": {"title": "Contact Us"}}],
            },
        ],
        navigation={"logo_text": "Test", "links": [{"label": "Home", "url": "/"}]},
        footer={
            "columns": [{"title": "Shop", "links": []}],
            "copyright": "© 2026",
            "social_links": {},
        },
        seo_defaults={"title_pattern": "{{page_title}} | {{store_name}}"},
        demo_content={
            "collections": [{"name": "New Arrivals", "slug": "new-arrivals"}],
            "categories": [{"name": "Clothing", "slug": "clothing"}],
        },
    )

    return token, org, store, template


class TestTemplateCRUD:
    def test_list_templates(self, api_client):
        token, org, store, template = _setup("tmpl-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/templates/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1

    def test_get_template_detail(self, api_client):
        token, org, store, template = _setup("tmpl-detail@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/templates/{template.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Fashion"
        assert len(response.data["pages"]) == 3

    def test_marketplace_endpoint(self, api_client):
        token, org, store, template = _setup("tmpl-market@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/templates/marketplace/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1

    def test_filter_by_category(self, api_client):
        token, org, store, template = _setup("tmpl-filter@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/templates/", {"category": "fashion"})
        assert response.status_code == status.HTTP_200_OK

    def test_preview_endpoint(self, api_client):
        token, org, store, template = _setup("tmpl-preview@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/templates/{template.id}/preview/")
        assert response.status_code == status.HTTP_200_OK
        assert "config" in response.data
        assert "pages" in response.data

    def test_export_endpoint(self, api_client):
        token, org, store, template = _setup("tmpl-export@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/templates/{template.id}/export/")
        assert response.status_code == status.HTTP_200_OK
        assert "name" in response.data
        assert "config" in response.data


class TestTemplateInstall:
    def test_install_creates_theme_and_pages(self, api_client):
        token, org, store, template = _setup("tmpl-install@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/templates/{template.id}/install/",
            {
                "store_id": str(store.id),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["pages_created"] == 3

        from apps.themes.models import Theme

        assert Theme.objects.filter(organization=org).exists()

        from apps.pages.models import Page

        assert Page.objects.filter(organization=org, store=store).count() == 3

        store.refresh_from_db()
        assert store.navigation != {}
        assert store.footer_config != {}
        assert store.theme is not None

    def test_install_requires_store_id(self, api_client):
        token, org, store, template = _setup("tmpl-nostore@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(f"/api/v1/templates/{template.id}/install/", {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_install_creates_collections_and_categories(self, api_client):
        token, org, store, template = _setup("tmpl-colls@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        api_client.post(
            f"/api/v1/templates/{template.id}/install/",
            {
                "store_id": str(store.id),
            },
            format="json",
        )

        from apps.products.models import Category, Collection

        assert Collection.objects.filter(organization=org, store=store).count() >= 1
        assert Category.objects.filter(organization=org, store=store).count() >= 1
