from __future__ import annotations

from rest_framework import serializers

from apps.notifications.models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "entity_type",
            "entity_id",
            "is_read",
            "action_url",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "id",
            "order_notifications",
            "product_notifications",
            "store_notifications",
            "billing_notifications",
            "system_notifications",
            "ai_notifications",
            "email_notifications",
            "push_notifications",
        ]
        read_only_fields = ["id"]
