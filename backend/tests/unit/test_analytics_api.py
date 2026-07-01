from datetime import timedelta as dt_timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.analytics.models import DailyStats, Event
from tests.factories import create_org_with_owner_and_store


class TestEventViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.store, self.token = create_org_with_owner_and_store(
            "analytics@test.com"
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_list_events(self):
        response = self.client.get("/api/v1/analytics/events/")
        assert response.status_code == status.HTTP_200_OK

    def test_summary_empty(self):
        response = self.client.get("/api/v1/analytics/events/summary/")
        assert response.status_code == status.HTTP_200_OK
        assert "total_revenue" in response.data
        assert "revenue_chart" in response.data
        assert "recent_orders" in response.data

    def test_summary_with_stats(self):
        DailyStats.objects.create(
            organization=self.org,
            store=self.store,
            date=(timezone.now() - dt_timedelta(days=5)).date(),
            total_revenue=100,
            total_orders=5,
            total_visitors=10,
        )
        DailyStats.objects.create(
            organization=self.org,
            store=self.store,
            date=(timezone.now() - dt_timedelta(days=40)).date(),
            total_revenue=50,
            total_orders=2,
            total_visitors=3,
        )
        response = self.client.get("/api/v1/analytics/events/summary/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_revenue"] == 100
        assert response.data["total_orders"] == 5

    def test_revenue_chart(self):
        response = self.client.get("/api/v1/analytics/events/revenue_chart/")
        assert response.status_code == status.HTTP_200_OK
        assert "data" in response.data
        assert "period" in response.data

    def test_revenue_chart_week(self):
        response = self.client.get("/api/v1/analytics/events/revenue_chart/?period=week")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["period"] == "week"

    def test_revenue_chart_month(self):
        response = self.client.get("/api/v1/analytics/events/revenue_chart/?period=month")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["period"] == "month"

    def test_realtime(self):
        response = self.client.get("/api/v1/analytics/events/realtime/")
        assert response.status_code == status.HTTP_200_OK
        assert "total_events" in response.data
        assert "page_views" in response.data
        assert "visitors" in response.data

    def test_realtime_with_events(self):
        Event.objects.create(
            organization=self.org,
            store=self.store,
            event_type="page_view",
            url="https://example.com",
            visitor_id="v1",
        )
        Event.objects.create(
            organization=self.org,
            store=self.store,
            event_type="purchase",
            url="https://example.com/checkout",
            visitor_id="v2",
        )
        response = self.client.get("/api/v1/analytics/events/realtime/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_events"] == 2
        assert response.data["page_views"] == 1
        assert response.data["purchases"] == 1
