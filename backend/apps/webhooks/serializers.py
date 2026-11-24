from __future__ import annotations

import secrets

from rest_framework import serializers

from apps.webhooks.services import EVENT_TYPES

from .models import WebhookDelivery, WebhookEndpoint


class WebhookEndpointSerializer(serializers.ModelSerializer):
    event_types_available = serializers.SerializerMethodField()

    class Meta:
        model = WebhookEndpoint
        fields = [
            "id",
            "url",
            "secret",
            "events",
            "is_active",
            "event_types_available",
            "created_at",
        ]
        read_only_fields = ["id", "secret", "created_at"]

    def get_event_types_available(self, obj) -> list[str]:
        return EVENT_TYPES

    def validate_events(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("events must be a list.")
        invalid = [e for e in value if e != "*" and e not in EVENT_TYPES]
        if invalid:
            raise serializers.ValidationError(
                f"Unknown event types: {invalid}. Valid: {EVENT_TYPES}"
            )
        return value

    def validate_url(self, value):
        if not value.lower().startswith(("http://", "https://")):
            raise serializers.ValidationError("URL must be http(s).")
        return value


class WebhookEndpointCreateSerializer(WebhookEndpointSerializer):
    secret = serializers.CharField(read_only=True)

    class Meta(WebhookEndpointSerializer.Meta):
        pass


class WebhookDeliverySerializer(serializers.ModelSerializer):
    endpoint_url = serializers.CharField(source="endpoint.url", read_only=True)

    class Meta:
        model = WebhookDelivery
        fields = [
            "id",
            "endpoint",
            "endpoint_url",
            "event_type",
            "payload",
            "status",
            "response_status",
            "attempts",
            "error",
            "created_at",
        ]
        read_only_fields = fields


def rotate_secret(endpoint: WebhookEndpoint) -> WebhookEndpoint:
    endpoint.secret = "whsec_" + secrets.token_urlsafe(32)
    endpoint.save(update_fields=["secret", "updated_at"])
    return endpoint
