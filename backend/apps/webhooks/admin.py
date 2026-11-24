from __future__ import annotations

from django.contrib import admin

from apps.core.admin import TenantAdminMixin

from .models import WebhookDelivery, WebhookEndpoint


@admin.register(WebhookEndpoint)
class WebhookEndpointAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ("url", "organization", "is_active", "created_at")
    list_filter = ("is_active",)


@admin.register(WebhookDelivery)
class WebhookDeliveryAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ("event_type", "endpoint", "status", "attempts", "created_at")
    list_filter = ("status", "event_type")
