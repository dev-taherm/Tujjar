from __future__ import annotations

import uuid

import pytest
from rest_framework import status
from tests.factories import create_org_with_owner, create_org_with_owner_and_store

from apps.templates.models import Template, TemplateVersion

pytestmark = pytest.mark.django_db


def _create_system_template(slug="sys-template", **kwargs):
    defaults = {
        "name": "System Template",
        "slug": slug,
        "config": {"colors": {"primary": "#000"}},
        "pages": [{"title": "Home", "slug": "home", "page_type": "homepage", "sections": []}],
        "navigation": {"logo_text": "Test", "links": []},
        "footer": {"columns": [], "copyright": "Test"},
        "is_system": True,
    }
    defaults.update(kwargs)
    return Template.objects.create(**defaults)


def _create_custom_template(slug="custom-template", **kwargs):
    defaults = {
        "name": "Custom Template",
        "slug": slug,
        "config": {"colors": {"primary": "#abc"}},
        "pages": [{"title": "Home", "slug": "home", "page_type": "homepage", "sections": []}],
    }
    defaults.update(kwargs)
    return Template.objects.create(**defaults)


class TestTemplateCRUD:
    def test_list_templates(self, api_client):
        user, org, token = create_org_with_owner("tpl-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        _create_system_template(slug="list-sys")
        _create_custom_template(slug="list-custom")
        response = api_client.get("/api/v1/templates/")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_template(self, api_client):
        user, org, token = create_org_with_owner("tpl-retrieve@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="retrieve-tpl")
        response = api_client.get(f"/api/v1/templates/{t.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Custom Template"

    def test_create_template(self, api_client):
        user, org, token = create_org_with_owner("tpl-create@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/templates/",
            {
                "name": "New Template",
                "slug": "new-template",
                "config": {"colors": {"primary": "#111"}},
                "pages": [{"title": "Page", "slug": "page", "sections": []}],
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert Template.objects.filter(slug="new-template").exists()

    def test_create_template_auto_snapshot(self, api_client):
        user, org, token = create_org_with_owner("tpl-create-snap@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/templates/",
            {"name": "Snap Template", "slug": "snap-template", "config": {"a": 1}, "pages": []},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        t = Template.objects.get(slug="snap-template")
        versions = TemplateVersion.objects.filter(template=t)
        assert versions.count() == 1
        assert versions.first().note == "Initial version"

    def test_update_template(self, api_client):
        user, org, token = create_org_with_owner("tpl-update@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="update-tpl")
        response = api_client.patch(
            f"/api/v1/templates/{t.id}/",
            {"name": "Updated Template"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Template"

    def test_update_template_auto_snapshot(self, api_client):
        user, org, token = create_org_with_owner("tpl-update-snap@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="update-snap-tpl")
        api_client.patch(
            f"/api/v1/templates/{t.id}/",
            {"name": "Bumped"},
            format="json",
        )
        t.refresh_from_db()
        assert t.version == "1.0.1"
        versions = TemplateVersion.objects.filter(template=t)
        assert versions.first().note == "Auto-saved on update"

    def test_delete_custom_template(self, api_client):
        user, org, token = create_org_with_owner("tpl-delete@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="delete-tpl")
        response = api_client.delete(f"/api/v1/templates/{t.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Template.objects.filter(pk=t.id).exists()

    def test_delete_system_template_fails(self, api_client):
        user, org, token = create_org_with_owner("tpl-del-sys@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_system_template(slug="del-sys-tpl")
        response = api_client.delete(f"/api/v1/templates/{t.id}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestTemplateVersions:
    def test_list_versions(self, api_client):
        user, org, token = create_org_with_owner("tpl-ver-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="ver-list-tpl")
        TemplateVersion.objects.create(template=t, version="1.0.0", note="First")
        TemplateVersion.objects.create(template=t, version="1.0.1", note="Second")
        response = api_client.get(f"/api/v1/templates/{t.id}/versions/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert response.data[0]["note"] == "Second"

    def test_version_detail(self, api_client):
        user, org, token = create_org_with_owner("tpl-ver-detail@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="ver-detail-tpl")
        v = TemplateVersion.objects.create(
            template=t,
            version="1.0.0",
            config={"a": 1},
            pages=[{"title": "X"}],
            note="Detail test",
        )
        response = api_client.get(f"/api/v1/templates/{t.id}/versions/{v.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["config"] == {"a": 1}
        assert response.data["pages"] == [{"title": "X"}]

    def test_version_detail_not_found(self, api_client):
        user, org, token = create_org_with_owner("tpl-ver-nf@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="ver-nf-tpl")
        response = api_client.get(f"/api/v1/templates/{t.id}/versions/{uuid.uuid4()}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestTemplateRollback:
    def test_rollback(self, api_client):
        user, org, token = create_org_with_owner("tpl-rollback@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="rollback-tpl", config={"a": "current"})
        v = TemplateVersion.objects.create(
            template=t,
            version="1.0.0",
            config={"a": "old"},
            pages=[{"old": True}],
        )
        response = api_client.post(
            f"/api/v1/templates/{t.id}/rollback/",
            {"version_id": str(v.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        t.refresh_from_db()
        assert t.config == {"a": "old"}
        assert t.pages == [{"old": True}]
        assert t.version == "1.0.1"

    def test_rollback_creates_snapshot(self, api_client):
        user, org, token = create_org_with_owner("tpl-rollback-snap@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="rollback-snap-tpl")
        v = TemplateVersion.objects.create(template=t, version="1.0.0", config={"a": "old"})
        count_before = TemplateVersion.objects.filter(template=t).count()
        api_client.post(
            f"/api/v1/templates/{t.id}/rollback/",
            {"version_id": str(v.id)},
            format="json",
        )
        count_after = TemplateVersion.objects.filter(template=t).count()
        assert count_after > count_before

    def test_rollback_no_version_id(self, api_client):
        user, org, token = create_org_with_owner("tpl-rollback-novid@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="rollback-novid-tpl")
        response = api_client.post(f"/api/v1/templates/{t.id}/rollback/", {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rollback_invalid_version(self, api_client):
        user, org, token = create_org_with_owner("tpl-rollback-invalid@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="rollback-invalid-tpl")
        response = api_client.post(
            f"/api/v1/templates/{t.id}/rollback/",
            {"version_id": str(uuid.uuid4())},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestTemplateDuplicate:
    def test_duplicate(self, api_client):
        user, org, token = create_org_with_owner("tpl-dup@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="dup-tpl", config={"a": 1}, pages=[{"title": "X"}])
        response = api_client.post(
            f"/api/v1/templates/{t.id}/duplicate/",
            {"name": "Duped Template"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        dup = Template.objects.get(id=response.data["id"])
        assert dup.name == "Duped Template"
        assert dup.config == t.config
        assert dup.pages == t.pages
        assert dup.is_system is False

    def test_duplicate_slug_collision(self, api_client):
        user, org, token = create_org_with_owner("tpl-dup-slug@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="dup-slug-tpl", name="Original")
        _create_custom_template(slug="dup-slug-tpl-1", name="Original Copy")
        response = api_client.post(
            f"/api/v1/templates/{t.id}/duplicate/",
            {"name": "Original Copy"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        dup = Template.objects.get(id=response.data["id"])
        assert dup.slug != "dup-slug-tpl"
        assert dup.slug != "dup-slug-tpl-1"


class TestTemplateExportImport:
    def test_export(self, api_client):
        user, org, token = create_org_with_owner("tpl-export@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_custom_template(slug="export-tpl")
        response = api_client.get(f"/api/v1/templates/{t.id}/export/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Custom Template"
        assert "id" not in response.data
        assert "is_system" not in response.data

    def test_import(self, api_client):
        user, org, token = create_org_with_owner("tpl-import@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        payload = {
            "data": {
                "name": "Imported Template",
                "slug": "imported-tpl",
                "config": {"colors": {"primary": "#abc"}},
                "pages": [{"title": "Home", "slug": "home", "sections": []}],
            }
        }
        response = api_client.post("/api/v1/templates/import/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Template.objects.filter(slug="imported-tpl").exists()

    def test_import_creates_snapshot(self, api_client):
        user, org, token = create_org_with_owner("tpl-import-snap@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        payload = {
            "data": {
                "name": "Import Snap",
                "slug": "import-snap-tpl",
                "config": {"a": 1},
                "pages": [],
            }
        }
        api_client.post("/api/v1/templates/import/", payload, format="json")
        t = Template.objects.get(slug="import-snap-tpl")
        assert TemplateVersion.objects.filter(template=t, note="Imported").exists()

    def test_import_missing_fields(self, api_client):
        user, org, token = create_org_with_owner("tpl-import-miss@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/templates/import/",
            {"data": {"name": "Bad"}},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_slug_collision(self, api_client):
        user, org, token = create_org_with_owner("tpl-import-dup@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        _create_custom_template(slug="existing-tpl")
        response = api_client.post(
            "/api/v1/templates/import/",
            {"data": {"name": "Existing", "slug": "existing-tpl", "config": {"a": 1}, "pages": []}},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestTemplateMarketplace:
    def test_marketplace(self, api_client):
        user, org, token = create_org_with_owner("tpl-mp@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        _create_system_template(slug="mp-tpl")
        response = api_client.get("/api/v1/templates/marketplace/")
        assert response.status_code == status.HTTP_200_OK

    def test_marketplace_only_system(self, api_client):
        user, org, token = create_org_with_owner("tpl-mp-sys@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        _create_system_template(slug="mp-sys-tpl")
        _create_custom_template(slug="mp-custom-tpl")
        response = api_client.get("/api/v1/templates/marketplace/")
        assert response.status_code == status.HTTP_200_OK
        slugs = [t["slug"] for t in response.data.get("results", response.data)]
        assert "mp-sys-tpl" in slugs
        assert "mp-custom-tpl" not in slugs


class TestTemplateInstall:
    def test_install(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("tpl-install@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_system_template(slug="install-sys-tpl")
        response = api_client.post(
            f"/api/v1/templates/{t.id}/install/",
            {"store_id": str(store.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["pages_created"] == 1
        store.refresh_from_db()
        assert store.template == t
        assert store.theme is not None

    def test_install_creates_snapshot(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("tpl-install-snap@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_system_template(slug="install-snap-tpl")
        api_client.post(
            f"/api/v1/templates/{t.id}/install/",
            {"store_id": str(store.id)},
            format="json",
        )
        versions = TemplateVersion.objects.filter(template=t)
        assert versions.exists()
        assert "Installed to store" in versions.first().note

    def test_install_returns_replaced_counts(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("tpl-install-count@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_system_template(slug="install-count-tpl")
        response = api_client.post(
            f"/api/v1/templates/{t.id}/install/",
            {"store_id": str(store.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert "replaced" in response.data
        assert "pages" in response.data["replaced"]

    def test_install_no_store_id(self, api_client):
        user, org, token = create_org_with_owner("tpl-install-noid@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_system_template(slug="install-noid-tpl")
        response = api_client.post(f"/api/v1/templates/{t.id}/install/", {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_install_nonexistent_store(self, api_client):
        user, org, token = create_org_with_owner("tpl-install-nf@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        t = _create_system_template(slug="install-nf-tpl")
        response = api_client.post(
            f"/api/v1/templates/{t.id}/install/",
            {"store_id": str(uuid.uuid4())},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
