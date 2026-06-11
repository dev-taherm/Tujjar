import pytest
from django.test import TestCase
from decimal import Decimal

from apps.analytics.models import Event, DailyStats


class TestEventModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store
        self.user = User.objects.create_user(email="analytics@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test Analytics", slug="test-analytics-org")
        self.store = Store.objects.create(
            organization=self.org, name="Analytics Store", slug="analytics-store",
        )
    
    def test_create_event(self):
        event = Event.objects.create(
            organization=self.org, store=self.store,
            event_type="page_view", url="https://example.com",
            metadata={"page": "home"},
        )
        self.assertIsNotNone(event.id)


class TestDailyStatsModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store
        self.user = User.objects.create_user(email="stats@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test Stats", slug="test-stats-org")
        self.store = Store.objects.create(
            organization=self.org, name="Stats Store", slug="stats-store",
        )
    
    def test_create_daily_stats(self):
        stats = DailyStats.objects.create(
            store=self.store, organization=self.org,
            date="2026-01-01", total_orders=10,
            total_revenue=Decimal("500.00"),
        )
        self.assertIn("2026-01-01", str(stats))
