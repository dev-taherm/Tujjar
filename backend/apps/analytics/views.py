from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.analytics.models import DailyStats, Event
from apps.analytics.serializers import (
    EventCreateSerializer,
    EventSerializer,
)
from apps.core.viewsets import TenantViewSet


class EventViewSet(TenantViewSet):
    serializer_class = EventSerializer
    required_permission = "analytics.view"

    def get_queryset(self):
        return Event.objects.filter(organization_id=self.request.org_id)

    def get_serializer_class(self):
        if self.action == "create":
            return EventCreateSerializer
        return EventSerializer

    def perform_create(self, serializer):
        org_id = self.request.org_id
        store_id = getattr(self.request, "store_id", None)
        if not store_id:
            from apps.stores.models import Store

            first_store = Store.unscoped.filter(organization_id=org_id).first()
            if first_store:
                store_id = str(first_store.id)
        Event.objects.create(
            organization_id=org_id,
            store_id=store_id,
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
            organization_id=org_id,
            date__gte=period_start.date(),
        ).aggregate(
            revenue=Sum("total_revenue"),
            orders=Sum("total_orders"),
            customers=Sum("total_visitors"),
            products_sold=Sum("total_products_sold"),
        )
        prev_stats = DailyStats.objects.filter(
            organization_id=org_id,
            date__gte=prev_start.date(),
            date__lt=period_start.date(),
        ).aggregate(
            revenue=Sum("total_revenue"),
            orders=Sum("total_orders"),
            customers=Sum("total_visitors"),
            products_sold=Sum("total_products_sold"),
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
            organization_id=org_id,
            event_type="purchase",
        ).order_by("-created_at")[:5]

        # Top products by revenue in the period (from order line items)
        from apps.orders.models import OrderItem

        top_products_qs = (
            OrderItem.objects.filter(
                order__organization_id=org_id,
                order__created_at__gte=period_start,
                order__status__in=["confirmed", "processing", "shipped", "delivered"],
            )
            .values("title")
            .annotate(
                revenue=Sum("total_price"),
                units_sold=Sum("quantity"),
                order_count=Count("order", distinct=True),
            )
            .order_by("-revenue")[:5]
        )
        top_products = [
            {
                "title": row["title"],
                "revenue": float(row["revenue"] or 0),
                "units_sold": row["units_sold"],
                "order_count": row["order_count"],
            }
            for row in top_products_qs
        ]

        # Traffic sources by referrer host over the period
        traffic_events = Event.objects.filter(
            organization_id=org_id,
            created_at__gte=period_start,
            event_type="page_view",
        ).exclude(referrer="")

        def _referrer_host(url: str) -> str:
            try:
                from urllib.parse import urlparse

                host = urlparse(url).netloc.lower()
                return host.split(":")[0] or "direct"
            except Exception:  # pragma: no cover — defensive
                return "direct"

        hosts = {}
        for ref in traffic_events.values_list("referrer", flat=True)[:5000]:
            host = _referrer_host(ref)
            hosts[host] = hosts.get(host, 0) + 1
        traffic_sources = dict(sorted(hosts.items(), key=lambda kv: kv[1], reverse=True)[:6])

        # Last 30 days chart — single bulk query instead of N+1
        chart_start = (now - timedelta(days=29)).date()
        chart_stats = {
            s["date"]: s
            for s in DailyStats.objects.filter(
                organization_id=org_id,
                date__gte=chart_start,
            ).values("date", "total_revenue", "total_orders")
        }
        chart = []
        for i in range(30):
            day = (now - timedelta(days=i)).date()
            s = chart_stats.get(day)
            chart.append(
                {
                    "date": day.isoformat(),
                    "revenue": float(s["total_revenue"]) if s else 0,
                    "orders": s["total_orders"] if s else 0,
                }
            )
        chart.reverse()

        return Response(
            {
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "total_customers": total_customers,
                "total_products_sold": current_stats["products_sold"] or 0,
                "revenue_change_pct": pct_change(total_revenue, prev_revenue),
                "orders_change_pct": pct_change(total_orders, prev_orders),
                "customers_change_pct": pct_change(total_customers, prev_customers),
                "recent_orders": EventSerializer(recent_orders, many=True).data,
                "top_products": top_products,
                "revenue_chart": chart,
                "traffic_sources": traffic_sources,
            }
        )

    @action(detail=False, methods=["get"])
    def revenue_chart(self, request):
        org_id = request.org_id
        period = request.query_params.get("period", "day")
        days = {"day": 30, "week": 12, "month": 12}.get(period, 30)
        start = timezone.now().date() - timedelta(days=days)

        stats = DailyStats.objects.filter(
            organization_id=org_id,
            date__gte=start,
        ).order_by("date")

        data = [
            {
                "date": s.date.isoformat(),
                "revenue": float(s.total_revenue),
                "orders": s.total_orders,
            }
            for s in stats
        ]
        return Response({"period": period, "data": data})

    @action(detail=False, methods=["get"])
    def realtime(self, request):
        org_id = request.org_id
        since = timezone.now() - timedelta(hours=24)
        events = Event.objects.filter(
            organization_id=org_id,
            created_at__gte=since,
        )
        return Response(
            {
                "total_events": events.count(),
                "page_views": events.filter(event_type="page_view").count(),
                "product_views": events.filter(event_type="product_view").count(),
                "purchases": events.filter(event_type="purchase").count(),
                "visitors": events.values("visitor_id").distinct().count(),
            }
        )
