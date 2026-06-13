from django.contrib import admin

from .models import DailyStats, Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        "event_type",
        "entity_type",
        "entity_id",
        "store",
        "visitor_id",
        "created_at",
    ]
    list_filter = ["event_type", "store"]
    search_fields = ["entity_type", "visitor_id", "session_id"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(DailyStats)
class DailyStatsAdmin(admin.ModelAdmin):
    list_display = [
        "store",
        "date",
        "total_orders",
        "total_revenue",
        "total_customers",
        "total_products_sold",
        "total_page_views",
        "total_visitors",
        "conversion_rate",
        "average_order_value",
    ]
    list_filter = ["store", "date"]
    search_fields = ["store__name"]
    readonly_fields = ["created_at", "updated_at"]
