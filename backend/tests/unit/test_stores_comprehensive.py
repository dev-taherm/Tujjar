from __future__ import annotations

from unittest.mock import patch

import pytest
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from tests.factories import (
    StoreDomainFactory,
    StoreFactory,
    create_org_with_owner,
    create_org_with_owner_and_store,
)

pytestmark = pytest.mark.django_db


class TestStoreCRUD:
    def test_create_store(self, api_client):
        user, org, token = create_org_with_owner("create-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/stores/",
            {"name": "My New Store", "slug": "my-new-store"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_stores(self, api_client):
        user, org, token = create_org_with_owner("list-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        StoreFactory(organization=org, name="Store A", slug="store-a")
        response = api_client.get("/api/v1/stores/")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_store(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("retrieve-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/stores/{store.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == store.name

    def test_update_store(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("update-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/stores/{store.id}/",
            {"description": "Updated description"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["description"] == "Updated description"

    def test_update_store_seo_fields(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("seo-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/stores/{store.id}/",
            {
                "seo_title": "My Store SEO",
                "seo_description": "Best store ever",
                "twitter_card": "summary",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["seo_title"] == "My Store SEO"
        assert response.data["seo_description"] == "Best store ever"
        assert response.data["twitter_card"] == "summary"

    def test_update_store_navigation(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("nav-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        nav = {
            "logo_text": "My Store",
            "links": [
                {"label": "Home", "url": "/", "order": 0},
                {"label": "Shop", "url": "/shop", "order": 1},
                {"label": "About", "url": "/about", "order": 2},
            ],
        }
        response = api_client.patch(
            f"/api/v1/stores/{store.id}/",
            {"navigation": nav},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["navigation"]["links"]) == 3

    def test_update_store_footer(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("footer-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        footer = {
            "columns": [
                {
                    "title": "Shop",
                    "links": [{"label": "All Products", "url": "/shop"}],
                }
            ],
            "copyright": "© 2026",
        }
        response = api_client.patch(
            f"/api/v1/stores/{store.id}/",
            {"footer_config": footer},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["footer_config"]["copyright"] == "© 2026"

    def test_delete_store(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("delete-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(f"/api/v1/stores/{store.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

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

    def test_get_current_store(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("current-store@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/stores/current/")
        assert response.status_code == status.HTTP_200_OK

    def test_get_current_store_none(self, api_client):
        from apps.stores.models import Store
        from tests.factories import OrganizationFactory, OwnerMembershipFactory, UserFactory

        user = UserFactory(email="no-store@example.com")
        org = OrganizationFactory(name="NoStore Org", slug="no-store-org")
        OwnerMembershipFactory(user=user, organization=org)
        Store.objects.filter(organization=org).delete()

        refresh = RefreshToken.for_user(user)
        refresh["org_id"] = str(org.id)
        token = str(refresh.access_token)

        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/stores/current/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_store_settings_json(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("settings-json@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/stores/{store.id}/update-settings/",
            {"settings": {"theme": {"colors": {"primary": "#ff0000"}}}},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["settings"]["theme"]["colors"]["primary"] == "#ff0000"


class TestSlugCheck:
    def test_slug_available(self, api_client):
        user, org, token = create_org_with_owner("slug-check@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/stores/check-slug/?slug=my-unique-slug")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is True

    def test_slug_taken(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("slug-taken@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/stores/check-slug/?slug={store.slug}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is False

    def test_slug_reserved(self, api_client):
        user, org, token = create_org_with_owner("slug-reserved@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/stores/check-slug/?slug=admin")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_slug_too_short(self, api_client):
        user, org, token = create_org_with_owner("slug-short@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/stores/check-slug/?slug=ab")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestSlugChange:
    def test_change_slug(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("slug-change@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/stores/{store.id}/change-slug/",
            {"slug": "brand-new-slug"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["slug"] == "brand-new-slug"

    def test_change_slug_same(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("slug-same@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/stores/{store.id}/change-slug/",
            {"slug": store.slug},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_slug_taken(self, api_client):
        user, org, token = create_org_with_owner("slug-taken-change@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        StoreFactory(organization=org, name="Store1", slug="store-one")
        store2 = StoreFactory(organization=org, name="Store2", slug="store-two")
        response = api_client.post(
            f"/api/v1/stores/{store2.id}/change-slug/",
            {"slug": "store-one"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_slug_invalid(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("slug-invalid@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/stores/{store.id}/change-slug/",
            {"slug": "admin"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_slug_store_not_found(self, api_client):
        user, org, token = create_org_with_owner("slug-notfound@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        import uuid

        response = api_client.post(
            f"/api/v1/stores/{uuid.uuid4()}/change-slug/",
            {"slug": "new-slug"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestStoreWizard:
    def test_wizard_create(self, api_client):
        user, org, token = create_org_with_owner("wizard-create@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/stores/wizard/",
            {
                "name": "Wizard Store",
                "slug": "wizard-store",
                "description": "Created via wizard",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Wizard Store"
        assert response.data["slug"] == "wizard-store"

    def test_wizard_create_auto_slug(self, api_client):
        user, org, token = create_org_with_owner("wizard-auto@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/stores/wizard/",
            {"name": "Auto Slug Store"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["slug"] == "auto-slug-store"

    def test_wizard_create_duplicate_slug(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("wizard-dup@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/stores/wizard/",
            {"name": "Dup Store", "slug": store.slug},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_wizard_create_reserved_slug(self, api_client):
        user, org, token = create_org_with_owner("wizard-reserved@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/stores/wizard/",
            {"name": "Admin Store", "slug": "admin"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_wizard_create_no_permission(self, api_client):
        from rest_framework_simplejwt.tokens import RefreshToken

        from apps.organizations.models import Role
        from tests.factories import OrganizationFactory, OwnerMembershipFactory, UserFactory

        user = UserFactory(email="wizard-noperm@example.com")
        org = OrganizationFactory(name="NoPerm Org", slug="noperm-org")
        viewer_role, _ = Role.objects.get_or_create(
            slug="viewer",
            organization=org,
            defaults={"name": "Viewer", "is_system": True},
        )
        OwnerMembershipFactory(user=user, organization=org, role=viewer_role)

        refresh = RefreshToken.for_user(user)
        refresh["org_id"] = str(org.id)
        token = str(refresh.access_token)

        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/stores/wizard/",
            {"name": "NoPerm Store", "slug": "noperm-store"},
            format="json",
        )
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST)


class TestStoreDomains:
    def test_list_domains(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("domain-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        StoreDomainFactory(store=store, domain="list.example.com")
        response = api_client.get(f"/api/v1/stores/{store.id}/domains/")
        assert response.status_code == status.HTTP_200_OK

    def test_create_domain(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("domain-create@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/stores/{store.id}/domains/",
            {"domain": "my-store.example.com"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_duplicate_domain(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("domain-dup@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        StoreDomainFactory(store=store, domain="dup.example.com")
        response = api_client.post(
            f"/api/v1/stores/{store.id}/domains/",
            {"domain": "dup.example.com"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_domain(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("domain-delete@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        domain = StoreDomainFactory(store=store, domain="delete.example.com")
        response = api_client.delete(f"/api/v1/stores/{store.id}/domains/{domain.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_primary_domain_clears_custom_domain(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("domain-delprimary@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        domain = StoreDomainFactory(
            store=store, domain="primary-delete.example.com", is_primary=True
        )
        store.custom_domain = domain.domain
        store.save(update_fields=["custom_domain"])

        response = api_client.delete(f"/api/v1/stores/{store.id}/domains/{domain.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        store.refresh_from_db()
        assert store.custom_domain is None

    def test_set_primary_domain(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("domain-primary@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        domain = StoreDomainFactory(store=store, domain="primary.example.com")
        response = api_client.post(f"/api/v1/stores/{store.id}/domains/{domain.id}/primary/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_primary"] is True
        store.refresh_from_db()
        assert store.custom_domain == "primary.example.com"

    def test_verify_domain_instructions(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("domain-instr@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        domain = StoreDomainFactory(store=store, domain="instr.example.com")
        response = api_client.get(f"/api/v1/stores/{store.id}/domains/{domain.id}/instructions/")
        assert response.status_code == status.HTTP_200_OK
        assert "instructions" in response.data
        assert response.data["instructions"]["cname"]["type"] == "CNAME"
        assert response.data["instructions"]["verification"]["type"] == "TXT"

    @patch("apps.stores.views.subprocess.run")
    def test_verify_domain_success(self, mock_run, api_client):
        user, org, store, token = create_org_with_owner_and_store("domain-verify@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        domain = StoreDomainFactory(store=store, domain="verify.example.com")

        def side_effect(cmd, **kwargs):
            class Result:
                def __init__(self, stdout):
                    self.stdout = stdout

            if "TXT" in cmd:
                return Result(
                    f'"v=spf1 include:_spf.google.com ~all" "{domain.verification_token}"'
                )
            return Result("93.184.216.34")

        mock_run.side_effect = side_effect
        response = api_client.post(f"/api/v1/stores/{store.id}/domains/{domain.id}/verify/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["verified"] is True

    @patch("apps.stores.views.subprocess.run")
    def test_verify_domain_fail_no_txt(self, mock_run, api_client):
        user, org, store, token = create_org_with_owner_and_store("domain-verify-fail@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        domain = StoreDomainFactory(store=store, domain="verify-fail.example.com")

        class Result:
            stdout = ""

        mock_run.return_value = Result()
        response = api_client.post(f"/api/v1/stores/{store.id}/domains/{domain.id}/verify/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["verified"] is False
        assert "details" in response.data
        assert response.data["details"]["txt"] is False
