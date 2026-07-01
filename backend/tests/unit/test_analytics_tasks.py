from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.analytics.models import DailyStats, Event
from apps.analytics.tasks import aggregate_daily_stats, aggregate_recent_stats
from apps.authentication.models import User
from apps.organizations.models import Organization
from apps.stores.models import Store


class TestAggregateDailyStats(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="task@test.com", password="pass123")
        self.org = Organization.objects.create(name="Task Org", slug="task-org")
        self.store = Store.objects.create(
            organization=self.org,
            name="Task Store",
            slug="task-store",
        )
        self.target_date = (timezone.now() - timedelta(days=2)).date()
        self.date_str = str(self.target_date)
        self.day_start = timezone.datetime.combine(
            self.target_date, timezone.datetime.min.time()
        ).replace(tzinfo=timezone.utc)

    def _create_event(self, **kwargs):
        event = Event.objects.create(
            organization=self.org,
            store=self.store,
            event_type="page_view",
            url="https://example.com",
            **kwargs,
        )
        Event.unscoped.filter(pk=event.pk).update(created_at=self.day_start)
        return event

    def test_aggregate_with_no_events(self):
        result = aggregate_daily_stats(date_str="2026-01-01")
        assert "2026-01-01" in result

    def test_aggregate_with_events(self):
        self._create_event()
        result = aggregate_daily_stats(date_str=self.date_str)
        assert self.date_str in result

    def test_creates_daily_stats(self):
        self._create_event()
        aggregate_daily_stats(date_str=self.date_str)
        assert DailyStats.unscoped.filter(
            organization=self.org,
            store=self.store,
            date=self.target_date,
        ).exists()

    def test_aggregate_no_date_uses_yesterday(self):
        result = aggregate_daily_stats()
        assert "Aggregated" in result

    def test_aggregate_recent_stats(self):
        result = aggregate_recent_stats()
        assert result is None
