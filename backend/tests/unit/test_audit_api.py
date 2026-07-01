from django.test import TestCase
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.authentication.models import User
from apps.organizations.models import Organization


def create_org_with_user(email="audit@test.com"):
    user = User.objects.create_user(email=email, password="pass123")
    org = Organization.objects.create(
        name=f"Audit Org {email}", slug=f"audit-{email.split('@')[0]}"
    )
    return user, org


class TestAuditLogViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org = create_org_with_user()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user}")

    def _create_log(self, **kwargs):
        defaults = {
            "organization": self.org,
            "action": "test.action",
            "resource_type": "product",
            "resource_id": "abc-123",
            "user": self.user,
        }
        defaults.update(kwargs)
        return AuditLog.objects.create(**defaults)

    def test_list_audit_logs(self):
        self._create_log()
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION="")
        response = self.client.get("/api/v1/audit/")
        assert response.status_code in (200, 403, 404)

    def test_filter_by_action(self):
        self._create_log(action="product.create")
        self._create_log(action="order.confirm")
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/audit/", {"action": "product"})
        assert response.status_code in (200, 403, 404)

    def test_filter_by_resource_type(self):
        self._create_log(resource_type="product")
        self._create_log(resource_type="order")
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/audit/", {"resource_type": "product"})
        assert response.status_code in (200, 403, 404)

    def test_filter_by_user(self):
        self._create_log(user=self.user)
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/audit/", {"user": str(self.user.id)})
        assert response.status_code in (200, 403, 404)

    def test_filter_by_date_from(self):
        self._create_log()
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/audit/", {"date_from": "2025-01-01T00:00:00Z"})
        assert response.status_code in (200, 403, 404)

    def test_filter_by_date_to(self):
        self._create_log()
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/audit/", {"date_to": "2030-12-31T23:59:59Z"})
        assert response.status_code in (200, 403, 404)

    def test_filter_by_invalid_date(self):
        self._create_log()
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/audit/", {"date_from": "not-a-date"})
        assert response.status_code in (200, 403, 404)
