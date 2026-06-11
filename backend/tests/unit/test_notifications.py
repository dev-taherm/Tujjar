import pytest
from django.test import TestCase

from apps.notifications.models import Notification, NotificationPreference


class TestNotificationModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        self.user = User.objects.create_user(email="notif@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test Notif", slug="test-notif-org")
    
    def test_create_notification(self):
        n = Notification.objects.create(
            user=self.user, organization=self.org,
            notification_type="order", title="New Order",
            message="You have a new order",
        )
        self.assertFalse(n.is_read)
        n.mark_as_read
        n.refresh_from_db()
        self.assertTrue(n.is_read)

    def test_notification_str(self):
        n = Notification.objects.create(
            user=self.user, organization=self.org,
            notification_type="system", title="System Alert",
            message="Alert",
        )
        self.assertEqual(str(n), "system: System Alert")


class TestNotificationPreferenceModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        self.user = User.objects.create_user(email="pref@test.com", password="pass123")
    
    def test_create_preference(self):
        pref = NotificationPreference.objects.create(user=self.user)
        self.assertTrue(pref.order_notifications)
        self.assertTrue(pref.email_notifications)
