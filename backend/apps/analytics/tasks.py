from __future__ import annotations

import datetime
import logging
from datetime import timedelta

from django.db.models import Count, Sum
from django.utils import timezone

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def aggregate_daily_stats(self, date_str: str | None = None):
    """Aggregate Event data into DailyStats for a given date (default: yesterday)."""
    from apps.analytics.models import DailyStats, Event
    from apps.orders.models import Order

    if date_str:
        target_date = timezone.datetime.strptime(date_str, "%Y-%m-%d").date()
    else:
        target_date = (timezone.now() - timedelta(days=1)).date()

    day_start = timezone.datetime.combine(target_date, timezone.datetime.min.time()).replace(
        tzinfo=datetime.timezone.utc
    )
    day_end = day_start + timedelta(days=1)

    stores = (
        Event.objects.filter(created_at__gte=day_start, created_at__lt=day_end)
        .values("store_id", "organization_id")
        .distinct()
    )

    for store_info in stores:
        store_id = store_info["store_id"]
        org_id = store_info["organization_id"]
        if not store_id:
            continue

        events = Event.objects.filter(
            store_id=store_id, created_at__gte=day_start, created_at__lt=day_end
        )

        orders = Order.objects.filter(
            store_id=store_id, created_at__gte=day_start, created_at__lt=day_end
        )
        order_stats = orders.aggregate(
            revenue=Sum("total"),
            orders_count=Count("id"),
        )

        visitors = events.values("visitor_id").distinct().count()

        top_products = (
            orders.values("items__product__title")
            .annotate(count=Count("items__product"))
            .order_by("-count")[:5]
        )
        top_products_list = [
            {"product": p["items__product__title"], "count": p["count"]}
            for p in top_products
            if p["items__product__title"]
        ]

        DailyStats.objects.update_or_create(
            organization_id=org_id,
            store_id=store_id,
            date=target_date,
            defaults={
                "total_revenue": order_stats["revenue"] or 0,
                "total_orders": order_stats["orders_count"] or 0,
                "total_visitors": visitors,
                "total_page_views": events.filter(event_type="page_view").count(),
                "total_products_sold": sum(
                    items["count"]
                    for items in orders.values("items__product_id").annotate(count=Count("id"))
                ),
                "top_products": top_products_list,
                "traffic_sources": {},
            },
        )

    logger.info("Aggregated daily stats for %s", target_date)
    return f"Aggregated stats for {target_date}"


@shared_task(bind=True, max_retries=3)
def aggregate_recent_stats(self):
    """Aggregate stats for the last 7 days."""
    for i in range(7):
        date = (timezone.now() - timedelta(days=i + 1)).date()
        aggregate_daily_stats.delay(date_str=str(date))
