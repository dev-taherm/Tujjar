import pytest
from rest_framework import status

from tests.factories import create_org_with_owner

pytestmark = pytest.mark.django_db


class TestSwitchOrganization:
    def test_switch_to_other_membership(self, api_client):
        from apps.organizations.models import Organization, OrganizationMembership, Role

        user, org, token = create_org_with_owner("switcher@example.com")

        # Second organization with accepted membership
        other = Organization.objects.create(name="Other Org", slug="other-org")
        role, _ = Role.objects.get_or_create(
            slug="owner", organization=None, defaults={"name": "Owner", "is_system": True}
        )
        OrganizationMembership.objects.create(
            user=user, organization=other, role=role, is_accepted=True
        )

        client = api_client
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.post(
            "/api/v1/auth/switch-org/", {"org_id": str(other.id)}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["organization"]["slug"] == "other-org"
        assert response.data["tokens"]["access"]

        # Decode the new access token's org claim
        import jwt as pyjwt

        new_access = response.data["tokens"]["access"]
        payload = pyjwt.decode(
            new_access, options={"verify_signature": False}
        )
        assert payload["org_id"] == str(other.id)

    def test_reject_non_member_org(self, api_client):
        from apps.organizations.models import Organization

        user, org, token = create_org_with_owner("lonely@example.com")
        stranger_org = Organization.objects.create(name="Strangers", slug="strangers")

        client = api_client
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.post(
            "/api/v1/auth/switch-org/", {"org_id": str(stranger_org.id)}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unknown_org_404(self, api_client):
        user, org, token = create_org_with_owner("unknown@example.com")
        client = api_client
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.post(
            "/api/v1/auth/switch-org/",
            {"org_id": "00000000-0000-0000-0000-000000000000"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_requires_authentication(self, api_client):
        response = api_client.post(
            "/api/v1/auth/switch-org/", {"org_id": "x"}, format="json"
        )
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
