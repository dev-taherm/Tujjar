from __future__ import annotations

from rest_framework import serializers

from apps.analytics.models import DailyStats, Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id", "event_type", "entity_type", "entity_id",
            "metadata", "session_id", "url", "referrer",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class EventCreateSerializer(serializers.Serializer):
    event_type = serializers.ChoiceField(choices=Event.EventType.choices)
    entity_type = serializers.CharField(required=False, default="")
    entity_id = serializers.UUIDField(required=False, allow_null=True)
    metadata = serializers.JSONField(required=False, default=dict)
    session_id = serializers.CharField(required=False, default="")
    url = serializers.CharField(required=False, default="")
    referrer = serializers.CharField(required=False, default="")


class DailyStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyStats
        fields = [
            "id", "date", "total_orders", "total_revenue",
            "total_customers", "total_products_sold",
            "total_page_views", "total_visitors", "total_searches",
            "conversion_rate", "average_order_value",
            "top_products", "traffic_sources",
        ]


class DashboardSummarySerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_orders = serializers.IntegerField()
    total_customers = serializers.IntegerField()
    total_products_sold = serializers.IntegerField()
    revenue_change_pct = serializers.FloatField()
    orders_change_pct = serializers.FloatField()
    customers_change_pct = serializers.FloatField()
    recent_orders = EventSerializer(many=True)
    top_products = serializers.ListField()
    revenue_chart = serializers.ListField()
    traffic_sources = serializers.DictField()


class RevenueChartSerializer(serializers.Serializer):
    period = serializers.ChoiceField(choices=["day", "week", "month"])
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    data = serializers.ListField()
