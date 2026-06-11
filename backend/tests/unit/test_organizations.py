import pytest
from django.test import TestCase
from rest_framework import status

from apps.authentication.models import User
from apps.organizations.models import Organization, OrganizationMembership, Role


class TestOrganizationCRUD(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="owner@example.com", password="testpass123"
        )
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

    def test_create_organization(self):
        response = self.client.post(
            "/api/v1/organizations/",
            {"name": "My Org", "slug": "my-org"},
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "My Org")
        # Verify owner membership was created
        org = Organization.objects.get(slug="my-org")
        self.assertTrue(
            OrganizationMembership.objects.filter(
                user=self.user, organization=org, role__slug="owner"
            ).exists()
        )

    def test_list_organizations(self):
        org = Organization.objects.create(name="Test Org", slug="test-org")
        role = Role.objects.get(slug="owner")
        OrganizationMembership.objects.create(
            user=self.user, organization=org, role=role, is_accepted=True
        )
        response = self.client.get(
            "/api/v1/organizations/",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_organization(self):
        org = Organization.objects.create(name="Old Name", slug="old-name")
        role = Role.objects.get(slug="owner")
        OrganizationMembership.objects.create(
            user=self.user, organization=org, role=role, is_accepted=True
        )
        response = self.client.patch(
            f"/api/v1/organizations/{org.id}/",
            {"name": "New Name"},
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        org.refresh_from_db()
        self.assertEqual(org.name, "New Name")

    def test_cannot_access_other_org(self):
        other_user = User.objects.create_user(
            email="other@example.com", password="testpass123"
        )
        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        role = Role.objects.get(slug="owner")
        OrganizationMembership.objects.create(
            user=other_user, organization=other_org, role=role, is_accepted=True
        )
        response = self.client.get(
            f"/api/v1/organizations/{other_org.id}/",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}",
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN],
        )
