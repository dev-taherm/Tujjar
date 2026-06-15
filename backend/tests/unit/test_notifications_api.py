import pytest
from rest_framework import status

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


def _setup(email="notif-test@example.com"):
    from apps.notifications.models import Notification

    user, org, store, token = create_org_with_owner_and_store(email)

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
        token, org, store, n1, n2 = _setup("notif-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/notifications/notifications/")
        assert response.status_code == status.HTTP_200_OK

    def test_mark_read(self, api_client):
        from apps.notifications.models import Notification

        token, org, store, n1, n2 = _setup("notif-read@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(f"/api/v1/notifications/notifications/{n1.id}/mark_read/")
        assert response.status_code == status.HTTP_200_OK

    def test_mark_all_read(self, api_client):
        token, org, store, n1, n2 = _setup("notif-all@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post("/api/v1/notifications/notifications/mark_all_read/")
        assert response.status_code == status.HTTP_200_OK

    def test_unread_count(self, api_client):
        token, org, store, n1, n2 = _setup("notif-count@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/notifications/notifications/unread_count/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2
