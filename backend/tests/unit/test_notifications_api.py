import pytest
from rest_framework import status

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


def _setup(email="notif-test@example.com"):
    from apps.notifications.models import Notification

    user, org, store, token = create_org_with_owner_and_store(email)

    n1 = Notification.objects.create(
        user=user,
        organization=org,
        notification_type="order",
        title="New Order",
        message="You have a new order",
    )
    n2 = Notification.objects.create(
        user=user,
        organization=org,
        notification_type="system",
        title="System Update",
        message="System maintenance scheduled",
    )
    return token, org, store, n1, n2


class TestNotificationAPI:
    def test_list_notifications(self, api_client):
        token, org, store, n1, n2 = _setup("notif-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/notifications/notifications/")
        assert response.status_code == status.HTTP_200_OK

    def test_mark_read(self, api_client):

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


class TestNotificationEmailTasks:
    def test_send_notification_email_success(self):
        from unittest.mock import patch

        from apps.notifications.models import Notification, NotificationPreference
        from apps.notifications.tasks import send_notification_email_task
        from tests.factories import create_org_with_owner

        user, org, token = create_org_with_owner("notif-email-task@example.com")
        NotificationPreference.objects.create(user=user, email_notifications=True)
        notification = Notification.objects.create(
            user=user,
            organization=org,
            notification_type="order",
            title="Order Received",
            message="You have a new order #1234",
        )
        with patch("apps.notifications.tasks.send_mail") as mock_send:
            send_notification_email_task(str(notification.id))
            mock_send.assert_called_once()

    def test_send_notification_email_no_preference(self):
        from unittest.mock import patch

        from apps.notifications.models import Notification, NotificationPreference
        from apps.notifications.tasks import send_notification_email_task
        from tests.factories import create_org_with_owner

        user, org, token = create_org_with_owner("notif-no-pref@example.com")
        NotificationPreference.objects.create(user=user, email_notifications=False)
        notification = Notification.objects.create(
            user=user,
            organization=org,
            notification_type="order",
            title="Order Received",
            message="You have a new order #1234",
        )
        with patch("apps.notifications.tasks.send_mail") as mock_send:
            send_notification_email_task(str(notification.id))
            mock_send.assert_not_called()

    def test_send_notification_email_nonexistent(self):
        import uuid
        from unittest.mock import patch

        from apps.notifications.tasks import send_notification_email_task

        with patch("apps.notifications.tasks.send_mail") as mock_send:
            send_notification_email_task(str(uuid.uuid4()))
            mock_send.assert_not_called()

    def test_send_order_confirmation_email(self):
        from decimal import Decimal
        from unittest.mock import patch

        from apps.notifications.tasks import send_order_confirmation_email
        from apps.orders.models import Order
        from tests.factories import create_org_with_owner_and_store

        user, org, store, token = create_org_with_owner_and_store("order-confirm@example.com")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="buyer@test.com",
            customer_first_name="Buyer",
            status="confirmed",
            subtotal=Decimal("50.00"),
            total=Decimal("50.00"),
        )
        with patch("apps.notifications.tasks.send_mail") as mock_send:
            send_order_confirmation_email(str(order.id))
            mock_send.assert_called_once()
            call_kwargs = mock_send.call_args
            assert "buyer@test.com" in call_kwargs.kwargs["recipient_list"]

    def test_send_order_confirmation_nonexistent(self):
        import uuid
        from unittest.mock import patch

        from apps.notifications.tasks import send_order_confirmation_email

        with patch("apps.notifications.tasks.send_mail") as mock_send:
            send_order_confirmation_email(str(uuid.uuid4()))
            mock_send.assert_not_called()
