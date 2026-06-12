from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Sum, F
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.analytics.models import Event, DailyStats
from apps.analytics.serializers import (
    EventSerializer,
    EventCreateSerializer,
    DailyStatsSerializer,
    DashboardSummarySerializer,
)
class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer

    def get_queryset(self):
        return Event.objects.filter(organization_id=self.request.org_id)

    def get_serializer_class(self):
        if self.action == "create":
            return EventCreateSerializer
        return EventSerializer

    def perform_create(self, serializer):
        org = getattr(self.request, "organization", None)
        store = getattr(self.request, "store", None)
        Event.objects.create(
            organization=org,
            store=store,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
            **serializer.validated_data,
        )

    @action(detail=False, methods=["get"])
    def summary(self, request):
        org_id = request.org_id
        now = timezone.now()
        period_start = now - timedelta(days=30)
        prev_start = now - timedelta(days=60)

        current_stats = DailyStats.objects.filter(
            organization_id=org_id, date__gte=period_start.date(),
        ).aggregate(
            revenue=Sum("total_revenue"),
            orders=Sum("total_orders"),
            customers=Sum("total_visitors"),
        )
        prev_stats = DailyStats.objects.filter(
            organization_id=org_id,
            date__gte=prev_start.date(), date__lt=period_start.date(),
        ).aggregate(
            revenue=Sum("total_revenue"),
            orders=Sum("total_orders"),
            customers=Sum("total_visitors"),
        )

        def pct_change(curr, prev):
            if not prev or prev == 0:
                return 0.0
            return round(float((curr - prev) / prev * 100), 1)

        total_revenue = current_stats["revenue"] or 0
        total_orders = current_stats["orders"] or 0
        total_customers = current_stats["customers"] or 0
        prev_revenue = prev_stats["revenue"] or 0
        prev_orders = prev_stats["orders"] or 0
        prev_customers = prev_stats["customers"] or 0

        recent_orders = Event.objects.filter(
            organization_id=org_id, event_type="purchase",
        ).order_by("-created_at")[:5]

        # Last 30 days chart — single bulk query instead of N+1
        chart_start = (now - timedelta(days=29)).date()
        chart_stats = {
            s["date"]: s
            for s in DailyStats.objects.filter(
                organization_id=org_id, date__gte=chart_start,
            ).values("date", "total_revenue", "total_orders")
        }
        chart = []
        for i in range(30):
            day = (now - timedelta(days=i)).date()
            s = chart_stats.get(day)
            chart.append({
                "date": day.isoformat(),
                "revenue": float(s["total_revenue"]) if s else 0,
                "orders": s["total_orders"] if s else 0,
            })
        chart.reverse()

        return Response({
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_customers": total_customers,
            "total_products_sold": 0,
            "revenue_change_pct": pct_change(total_revenue, prev_revenue),
            "orders_change_pct": pct_change(total_orders, prev_orders),
            "customers_change_pct": pct_change(total_customers, prev_customers),
            "recent_orders": EventSerializer(recent_orders, many=True).data,
            "top_products": [],
            "revenue_chart": chart,
            "traffic_sources": {},
        })

    @action(detail=False, methods=["get"])
    def revenue_chart(self, request):
        org_id = request.org_id
        period = request.query_params.get("period", "day")
        days = {"day": 30, "week": 12, "month": 12}.get(period, 30)
        start = timezone.now().date() - timedelta(days=days)

        stats = DailyStats.objects.filter(
            organization_id=org_id, date__gte=start,
        ).order_by("date")

        data = [
            {"date": s.date.isoformat(), "revenue": float(s.total_revenue), "orders": s.total_orders}
            for s in stats
        ]
        return Response({"period": period, "data": data})

    @action(detail=False, methods=["get"])
    def realtime(self, request):
        org_id = request.org_id
        since = timezone.now() - timedelta(hours=24)
        events = Event.objects.filter(
            organization_id=org_id, created_at__gte=since,
        )
        return Response({
            "total_events": events.count(),
            "page_views": events.filter(event_type="page_view").count(),
            "product_views": events.filter(event_type="product_view").count(),
            "purchases": events.filter(event_type="purchase").count(),
            "visitors": events.values("visitor_id").distinct().count(),
        })
