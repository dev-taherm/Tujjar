from __future__ import annotations

import json
import uuid

import pytest
from rest_framework import status
from tests.factories import (
    create_org_with_owner,
    create_org_with_owner_and_store,
)

from apps.themes.models import Theme, ThemePreset, ThemeVersion


def _get_response_data(response):
    """Get response data as a dict, handling both DRF Response and Django HttpResponse."""
    if hasattr(response, "data"):
        return response.data
    if hasattr(response, "render"):
        response.render()
    return json.loads(response.content)


pytestmark = pytest.mark.django_db


def _create_system_theme(slug="default-theme", **kwargs):
    defaults = {
        "name": "Default Theme",
        "config": {"colors": {"primary": "#000", "bg": "#fff"}},
        "sections_schema": {"hero": {"type": "hero"}},
        "assets": {"css": "/default.css"},
        "is_system": True,
        "is_active": True,
    }
    defaults.update(kwargs)
    return Theme.objects.create(slug=slug, **defaults)


def _create_org_theme(org, slug="org-theme", **kwargs):
    defaults = {
        "name": "Org Theme",
        "organization": org,
        "config": {"colors": {"primary": "#abc"}},
    }
    defaults.update(kwargs)
    return Theme.objects.create(slug=slug, **defaults)


def _create_theme_with_presets(org, slug="preset-theme"):
    theme = Theme.objects.create(
        name="Preset Theme",
        slug=slug,
        organization=org,
        config={"colors": {"primary": "#000"}},
    )
    ThemePreset.objects.create(theme=theme, name="Dark", config={"colors": {"primary": "#111"}})
    ThemePreset.objects.create(theme=theme, name="Light", config={"colors": {"primary": "#eee"}})
    return theme


class TestThemeViewSet:
    def test_list_themes(self, api_client):
        user, org, token = create_org_with_owner("theme-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Theme.objects.create(name="My Theme", slug="my-theme", organization=org)
        response = api_client.get("/api/v1/themes/")
        assert response.status_code == status.HTTP_200_OK

    def test_create_theme(self, api_client):
        user, org, token = create_org_with_owner("theme-create@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/themes/",
            {
                "name": "New Theme",
                "slug": "new-theme",
                "config": {"colors": {"primary": "#000"}},
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Theme"
        assert Theme.objects.filter(slug="new-theme").exists()

    def test_retrieve_theme(self, api_client):
        user, org, token = create_org_with_owner("theme-retrieve@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="retrieve-theme")
        response = api_client.get(f"/api/v1/themes/{theme.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Org Theme"

    def test_update_theme(self, api_client):
        user, org, token = create_org_with_owner("theme-update@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="update-theme")
        response = api_client.put(
            f"/api/v1/themes/{theme.id}/",
            {
                "name": "Updated Theme",
                "slug": "update-theme",
                "config": {"colors": {"primary": "#fff"}},
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Theme"

    def test_partial_update_theme(self, api_client):
        user, org, token = create_org_with_owner("theme-patch@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="patch-theme")
        response = api_client.patch(
            f"/api/v1/themes/{theme.id}/",
            {"name": "Patched Theme"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Patched Theme"

    def test_delete_non_system_theme(self, api_client):
        user, org, token = create_org_with_owner("theme-delete@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="delete-theme")
        response = api_client.delete(f"/api/v1/themes/{theme.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Theme.unscoped.filter(pk=theme.id).exists()

    def test_delete_system_theme_fails(self, api_client):
        user, org, token = create_org_with_owner("theme-del-sys@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        system_theme = _create_system_theme(slug="del-sys-theme")
        response = api_client.delete(f"/api/v1/themes/{system_theme.id}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_auto_version_snapshot_on_update(self, api_client):
        user, org, token = create_org_with_owner("theme-snap@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="snap-theme")
        response = api_client.patch(
            f"/api/v1/themes/{theme.id}/",
            {"config": {"colors": {"primary": "#zzz"}}},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        versions = ThemeVersion.objects.filter(theme=theme)
        assert versions.count() >= 1


class TestMarketplace:
    def test_list_system_themes(self, api_client):
        user, org, token = create_org_with_owner("marketplace-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        _create_system_theme(slug="mp-list-theme")
        response = api_client.get("/api/v1/themes/marketplace/")
        assert response.status_code == status.HTTP_200_OK
        data = _get_response_data(response)
        results = data.get("results", data)
        slugs = [t["slug"] for t in results]
        assert "mp-list-theme" in slugs

    def test_marketplace_only_active_system(self, api_client):
        user, org, token = create_org_with_owner("marketplace-active@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Theme.objects.create(
            name="Inactive System",
            slug="inactive-sys",
            is_system=True,
            is_active=False,
        )
        response = api_client.get("/api/v1/themes/marketplace/")
        assert response.status_code == status.HTTP_200_OK
        data = _get_response_data(response)
        results = data.get("results", data)
        slugs = [t["slug"] for t in results]
        assert "inactive-sys" not in slugs


class TestThemeInstall:
    def test_install_system_theme(self, api_client):
        user, org, token = create_org_with_owner("theme-install@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        system_theme = _create_system_theme(slug="install-sys-theme")
        response = api_client.post(f"/api/v1/themes/{system_theme.id}/install/", format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == system_theme.name
        installed = Theme.unscoped.get(id=response.data["id"])
        assert installed.organization == org
        assert installed.parent_theme == system_theme
        assert installed.is_system is False

    def test_install_copies_presets(self, api_client):
        user, org, token = create_org_with_owner("theme-install-preset@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        sys_theme = _create_system_theme(slug="install-preset-sys")
        ThemePreset.objects.create(
            theme=sys_theme, name="Dark", config={"colors": {"primary": "#111"}}
        )
        ThemePreset.objects.create(
            theme=sys_theme, name="Light", config={"colors": {"primary": "#eee"}}
        )

        response = api_client.post(f"/api/v1/themes/{sys_theme.id}/install/", format="json")
        assert response.status_code == status.HTTP_201_CREATED
        installed = Theme.unscoped.get(id=response.data["id"])
        assert installed.presets.count() == 2
        assert set(installed.presets.values_list("name", flat=True)) == {
            "Dark",
            "Light",
        }

    def test_install_non_system_theme_fails(self, api_client):
        user, org, token = create_org_with_owner("theme-install-nonsys@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="install-nonsys-theme")
        response = api_client.post(f"/api/v1/themes/{theme.id}/install/", format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestThemeDuplicate:
    def test_duplicate_theme(self, api_client):
        user, org, token = create_org_with_owner("theme-dup@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="dup-theme")
        response = api_client.post(
            f"/api/v1/themes/{theme.id}/duplicate/",
            {"name": "Duplicate Theme"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Duplicate Theme"
        dup = Theme.unscoped.get(id=response.data["id"])
        assert dup.parent_theme == theme
        assert dup.config == theme.config

    def test_duplicate_copies_presets(self, api_client):
        user, org, token = create_org_with_owner("theme-dup-preset@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_theme_with_presets(org, slug="dup-preset-theme")
        response = api_client.post(
            f"/api/v1/themes/{theme.id}/duplicate/",
            {"name": "Dup Presets"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        dup = Theme.unscoped.get(id=response.data["id"])
        assert dup.presets.count() == 2

    def test_duplicate_system_theme(self, api_client):
        user, org, token = create_org_with_owner("theme-dup-sys@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        system_theme = _create_system_theme(slug="dup-sys-theme")
        response = api_client.post(
            f"/api/v1/themes/{system_theme.id}/duplicate/",
            {"name": "Dup System"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        dup = Theme.unscoped.get(id=response.data["id"])
        assert dup.name == "Dup System"
        assert dup.parent_theme == system_theme
        assert dup.config == system_theme.config


class TestThemeExport:
    def test_export_theme(self, api_client):
        import zipfile
        from io import BytesIO

        user, org, token = create_org_with_owner("theme-export@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_theme_with_presets(org, slug="export-theme")
        response = api_client.get(f"/api/v1/themes/{theme.id}/export/")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/zip"
        with zipfile.ZipFile(BytesIO(response.content)) as zf:
            assert "theme.json" in zf.namelist()
            data = json.loads(zf.read("theme.json"))
            assert data["name"] == "Preset Theme"
            assert "colors" in data["config"]
            assert len(data["presets"]) == 2


class TestThemeImport:
    def test_import_theme(self, api_client):
        user, org, token = create_org_with_owner("theme-import@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        payload = {
            "name": "Imported Theme",
            "config": {"colors": {"primary": "#abc"}},
            "sections_schema": {"hero": {"type": "hero"}},
            "assets": {"css": "/imported.css"},
            "presets": [
                {"name": "Dark", "config": {"colors": {"primary": "#111"}}},
            ],
        }
        response = api_client.post("/api/v1/themes/import/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Imported Theme"
        theme = Theme.unscoped.get(id=response.data["id"])
        assert theme.organization == org
        assert theme.config == {"colors": {"primary": "#abc"}}
        assert theme.presets.count() == 1
        assert theme.presets.first().name == "Dark"

    def test_import_no_config_fails(self, api_client):
        user, org, token = create_org_with_owner("theme-import-noconf@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/themes/import/",
            {"name": "Bad"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_slug_dedup(self, api_client):
        user, org, token = create_org_with_owner("theme-import-dedup@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        Theme.objects.create(
            name="Existing",
            slug="existing",
            organization=org,
        )
        response = api_client.post(
            "/api/v1/themes/import/",
            {"name": "Existing", "config": {"a": 1}},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        theme = Theme.unscoped.get(id=response.data["id"])
        assert theme.slug != "existing"


class TestThemeVersions:
    def test_list_versions(self, api_client):
        user, org, token = create_org_with_owner("theme-versions@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="versions-theme")
        ThemeVersion.objects.create(theme=theme, version="1.0.0", note="First")
        ThemeVersion.objects.create(theme=theme, version="1.0.1", note="Second")
        response = api_client.get(f"/api/v1/themes/{theme.id}/versions/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert response.data[0]["note"] == "Second"

    def test_update_creates_version_snapshot(self, api_client):
        user, org, token = create_org_with_owner("theme-update-snap@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="update-snap-theme")
        response = api_client.patch(
            f"/api/v1/themes/{theme.id}/",
            {"config": {"colors": {"primary": "#new"}}},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        versions = ThemeVersion.objects.filter(theme=theme)
        assert versions.exists()
        latest = versions.first()
        assert latest.note == "Auto-saved on update"

    def test_version_bumped_after_update(self, api_client):
        user, org, token = create_org_with_owner("theme-ver-bump@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="ver-bump-theme")
        response = api_client.patch(
            f"/api/v1/themes/{theme.id}/",
            {"name": "Bumped"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        theme.refresh_from_db()
        assert theme.version == "1.0.1"

    def test_version_detail(self, api_client):
        user, org, token = create_org_with_owner("theme-ver-detail@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="ver-detail-theme")
        version = ThemeVersion.objects.create(
            theme=theme,
            version="1.0.0",
            config={"colors": {"primary": "#aaa"}},
            sections_schema={"hero": {"type": "hero"}},
            assets={"css": "/a.css"},
            note="Test version",
        )
        response = api_client.get(f"/api/v1/themes/{theme.id}/versions/{version.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["version"] == "1.0.0"
        assert response.data["config"] == {"colors": {"primary": "#aaa"}}
        assert response.data["sections_schema"] == {"hero": {"type": "hero"}}
        assert response.data["assets"] == {"css": "/a.css"}
        assert response.data["note"] == "Test version"

    def test_version_detail_not_found(self, api_client):
        user, org, token = create_org_with_owner("theme-ver-notfound@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="ver-notfound-theme")
        response = api_client.get(f"/api/v1/themes/{theme.id}/versions/{uuid.uuid4()}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_snapshot(self, api_client):
        user, org, token = create_org_with_owner("theme-snapshot@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="snapshot-theme")
        count_before = ThemeVersion.objects.filter(theme=theme).count()
        response = api_client.post(
            f"/api/v1/themes/{theme.id}/snapshot/",
            {"note": "Manual checkpoint"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        count_after = ThemeVersion.objects.filter(theme=theme).count()
        assert count_after == count_before + 1
        latest = ThemeVersion.objects.filter(theme=theme).first()
        assert latest.note == "Manual checkpoint"

    def test_create_snapshot_default_note(self, api_client):
        user, org, token = create_org_with_owner("theme-snap-default@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="snap-default-theme")
        response = api_client.post(
            f"/api/v1/themes/{theme.id}/snapshot/",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        latest = ThemeVersion.objects.filter(theme=theme).first()
        assert latest.note == "Manual checkpoint"

    def test_auto_snapshot_on_create(self, api_client):
        user, org, token = create_org_with_owner("theme-auto-snap@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/themes/",
            {
                "name": "Auto Snap Theme",
                "slug": "auto-snap-theme",
                "config": {"colors": {"primary": "#000"}},
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        theme = Theme.unscoped.get(id=response.data["id"])
        versions = ThemeVersion.objects.filter(theme=theme)
        assert versions.count() == 1
        assert versions.first().note == "Initial version"


class TestThemeRollback:
    def test_rollback_to_version(self, api_client):
        user, org, token = create_org_with_owner("theme-rollback@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="rollback-theme")
        version = ThemeVersion.objects.create(
            theme=theme,
            version="1.0.0",
            config={"colors": {"primary": "#old"}},
            sections_schema={"hero": {"type": "old"}},
            assets={"css": "/old.css"},
            note="Old state",
        )
        response = api_client.post(
            f"/api/v1/themes/{theme.id}/rollback/",
            {"version_id": str(version.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        theme.refresh_from_db()
        assert theme.config == {"colors": {"primary": "#old"}}
        assert theme.sections_schema == {"hero": {"type": "old"}}
        assert theme.assets == {"css": "/old.css"}

    def test_rollback_creates_snapshot(self, api_client):
        user, org, token = create_org_with_owner("theme-rollback-snap@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="rollback-snap-theme")
        version = ThemeVersion.objects.create(
            theme=theme,
            version="1.0.0",
            config={"colors": {"primary": "#old"}},
        )
        count_before = ThemeVersion.objects.filter(theme=theme).count()
        api_client.post(
            f"/api/v1/themes/{theme.id}/rollback/",
            {"version_id": str(version.id)},
            format="json",
        )
        count_after = ThemeVersion.objects.filter(theme=theme).count()
        assert count_after > count_before

    def test_rollback_no_version_id_fails(self, api_client):
        user, org, token = create_org_with_owner("theme-rollback-novid@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="rollback-novid-theme")
        response = api_client.post(
            f"/api/v1/themes/{theme.id}/rollback/",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rollback_invalid_version_fails(self, api_client):
        user, org, token = create_org_with_owner("theme-rollback-invalid@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="rollback-invalid-theme")
        response = api_client.post(
            f"/api/v1/themes/{theme.id}/rollback/",
            {"version_id": str(uuid.uuid4())},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestThemePresets:
    def test_list_presets(self, api_client):
        user, org, token = create_org_with_owner("preset-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_theme_with_presets(org, slug="preset-list-theme")
        response = api_client.get(f"/api/v1/themes/{theme.id}/presets/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_create_preset(self, api_client):
        user, org, token = create_org_with_owner("preset-create@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="preset-create-theme")
        response = api_client.post(
            f"/api/v1/themes/{theme.id}/presets/",
            {"name": "Vibrant", "config": {"colors": {"primary": "#ff0"}}},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Vibrant"

    def test_update_preset(self, api_client):
        user, org, token = create_org_with_owner("preset-update@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_theme_with_presets(org, slug="preset-update-theme")
        preset = theme.presets.first()
        response = api_client.put(
            f"/api/v1/themes/{theme.id}/presets/{preset.id}/",
            {"name": "Updated Dark", "config": {"colors": {"primary": "#222"}}},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Dark"

    def test_partial_update_preset(self, api_client):
        user, org, token = create_org_with_owner("preset-patch@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_theme_with_presets(org, slug="preset-patch-theme")
        preset = theme.presets.first()
        response = api_client.patch(
            f"/api/v1/themes/{theme.id}/presets/{preset.id}/",
            {"name": "Patched"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Patched"

    def test_delete_preset(self, api_client):
        user, org, token = create_org_with_owner("preset-delete@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_theme_with_presets(org, slug="preset-delete-theme")
        preset = theme.presets.first()
        response = api_client.delete(f"/api/v1/themes/{theme.id}/presets/{preset.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ThemePreset.objects.filter(pk=preset.id).exists()


class TestSetTheme:
    def test_set_theme_on_store(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("set-theme-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        theme = _create_org_theme(org, slug="set-store-theme")
        response = api_client.post(
            f"/api/v1/stores/{store.id}/set-theme/",
            {"theme_id": str(theme.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        store.refresh_from_db()
        assert store.theme == theme

    def test_set_theme_no_theme_id_fails(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("set-theme-noid@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/stores/{store.id}/set-theme/",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_set_theme_nonexistent_fails(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("set-theme-notfound@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/stores/{store.id}/set-theme/",
            {"theme_id": str(uuid.uuid4())},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_set_system_theme_on_store(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("set-theme-sys@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        system_theme = _create_system_theme(slug="set-sys-theme")
        response = api_client.post(
            f"/api/v1/stores/{store.id}/set-theme/",
            {"theme_id": str(system_theme.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        store.refresh_from_db()
        assert store.theme is None
