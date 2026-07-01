from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.billing.models import Invoice, Plan, Subscription
from apps.organizations.models import Organization
from apps.platform.models import SystemConfig
from apps.stores.models import Store
from tests.factories import get_auth_token


def create_admin():
    user = User.objects.create_user(
        email="admin@test.com",
        password="pass123",
        is_staff=True,
        is_superuser=True,
    )
    token = get_auth_token(user)
    return user, token


class TestPlatformDashboard(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.token = create_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_dashboard(self):
        response = self.client.get("/api/v1/platform/dashboard/")
        assert response.status_code == status.HTTP_200_OK
        assert "total_users" in response.data
        assert "total_organizations" in response.data

    def test_dashboard_with_data(self):
        org = Organization.objects.create(name="Test Org", slug="test-plat-org")
        Store.objects.create(organization=org, name="Test Store", slug="test-plat-store")
        plan = Plan.objects.create(name="Pro", slug="pro-plat", price=Decimal("29.99"))
        Subscription.objects.create(organization=org, plan=plan, status="active")
        Invoice.objects.create(
            organization=org,
            amount=Decimal("29.99"),
            invoice_number="INV-1",
            status="paid",
        )
        response = self.client.get("/api/v1/platform/dashboard/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_users"] >= 1
        assert response.data["total_organizations"] >= 1


class TestPlatformUserViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin, self.token = create_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.user = User.objects.create_user(email="regular@test.com", password="pass123")

    def test_list_users(self):
        response = self.client.get("/api/v1/platform/users/")
        assert response.status_code == status.HTTP_200_OK

    def test_search_users(self):
        response = self.client.get("/api/v1/platform/users/?search=regular")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_active(self):
        response = self.client.get("/api/v1/platform/users/?is_active=true")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_staff(self):
        response = self.client.get("/api/v1/platform/users/?is_staff=true")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_user(self):
        response = self.client.get(f"/api/v1/platform/users/{self.user.id}/")
        assert response.status_code == status.HTTP_200_OK

    def test_partial_update_user(self):
        response = self.client.patch(
            f"/api/v1/platform/users/{self.user.id}/",
            {"first_name": "Updated"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK


class TestPlatformOrganizationViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin, self.token = create_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.org = Organization.objects.create(name="Plat Org", slug="plat-org")

    def test_list_orgs(self):
        response = self.client.get("/api/v1/platform/organizations/")
        assert response.status_code == status.HTTP_200_OK

    def test_search_orgs(self):
        response = self.client.get("/api/v1/platform/organizations/?search=plat")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_active(self):
        response = self.client.get("/api/v1/platform/organizations/?is_active=true")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_org(self):
        response = self.client.get(f"/api/v1/platform/organizations/{self.org.id}/")
        assert response.status_code == status.HTTP_200_OK

    def test_partial_update_org(self):
        response = self.client.patch(
            f"/api/v1/platform/organizations/{self.org.id}/",
            {"is_active": False},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        self.org.refresh_from_db()
        assert self.org.is_active is False


class TestPlatformStoreViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin, self.token = create_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.org = Organization.objects.create(name="Plat Org 2", slug="plat-org-2")
        self.store = Store.objects.create(
            organization=self.org, name="Plat Store", slug="plat-store"
        )

    def test_list_stores(self):
        response = self.client.get("/api/v1/platform/stores/")
        assert response.status_code == status.HTTP_200_OK

    def test_search_stores(self):
        response = self.client.get("/api/v1/platform/stores/?search=plat")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_active(self):
        response = self.client.get("/api/v1/platform/stores/?is_active=true")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_store(self):
        response = self.client.get(f"/api/v1/platform/stores/{self.store.id}/")
        assert response.status_code == status.HTTP_200_OK

    def test_partial_update_store(self):
        response = self.client.patch(
            f"/api/v1/platform/stores/{self.store.id}/",
            {"is_active": False},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        self.store.refresh_from_db()
        assert self.store.is_active is False


class TestPlatformPlanViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin, self.token = create_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.plan = Plan.objects.create(name="Free", slug="free-plat", price=Decimal("0"))

    def test_list_plans(self):
        response = self.client.get("/api/v1/platform/plans/")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_plan(self):
        response = self.client.get(f"/api/v1/platform/plans/{self.plan.id}/")
        assert response.status_code == status.HTTP_200_OK

    def test_update_plan(self):
        response = self.client.patch(
            f"/api/v1/platform/plans/{self.plan.id}/",
            {"price": 9.99},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

    def test_delete_plan(self):
        response = self.client.delete(f"/api/v1/platform/plans/{self.plan.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT


class TestPlatformSystemConfigViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin, self.token = create_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.config = SystemConfig.objects.create(key="test_key", value="test_value")

    def test_list_config(self):
        response = self.client.get("/api/v1/platform/config/")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_config(self):
        response = self.client.get(f"/api/v1/platform/config/{self.config.id}/")
        assert response.status_code == status.HTTP_200_OK

    def test_update_config(self):
        response = self.client.patch(
            f"/api/v1/platform/config/{self.config.id}/",
            {"value": "new_value"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

    def test_delete_config(self):
        response = self.client.delete(f"/api/v1/platform/config/{self.config.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
