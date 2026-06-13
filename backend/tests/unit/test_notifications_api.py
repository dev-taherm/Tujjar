import pytest
from rest_framework import status

pytestmark = pytest.mark.django_db


def _setup(api_client, email="notif-test@example.com"):
    from apps.authentication.models import User
    from apps.organizations.models import Organization, OrganizationMembership, Role
    from apps.stores.models import Store
    from apps.notifications.models import Notification

    user = User.objects.create_user(email=email, password="testpass123", is_verified=True)
    org = Organization.objects.create(name="Notif Org", slug=f"org-{email.split('@')[0]}")
    role, _ = Role.objects.get_or_create(slug="owner", organization=None, defaults={"name": "Owner", "is_system": True})
    OrganizationMembership.objects.create(user=user, organization=org, role=role, is_accepted=True)
    store = Store.objects.create(organization=org, name="Notif Store", slug=f"store-{email.split('@')[0]}")

    response = api_client.post("/api/v1/auth/login/", {"email": email, "password": "testpass123"})
    token = response.data["access"]

    n1 = Notification.objects.create(
        user=user, organization=org, notification_type="order",
        title="New Order", message="You have a new order",
    )
    n2 = Notification.objects.create(
        user=user, organization=org, notification_type="system",
        title="System Update", message="System maintenance scheduled",
    )
    return token, org, store, n1, n2


class TestNotificationAPI:
    def test_list_notifications(self, api_client):
        token, org, store, n1, n2 = _setup(api_client, "notif-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/notifications/notifications/")
        assert response.status_code == status.HTTP_200_OK

    def test_mark_read(self, api_client):
        from apps.notifications.models import Notification

        token, org, store, n1, n2 = _setup(api_client, "notif-read@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(f"/api/v1/notifications/notifications/{n1.id}/mark_read/")
        assert response.status_code == status.HTTP_200_OK

    def test_mark_all_read(self, api_client):
        token, org, store, n1, n2 = _setup(api_client, "notif-all@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post("/api/v1/notifications/notifications/mark_all_read/")
        assert response.status_code == status.HTTP_200_OK

    def test_unread_count(self, api_client):
        token, org, store, n1, n2 = _setup(api_client, "notif-count@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/notifications/notifications/unread_count/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2
