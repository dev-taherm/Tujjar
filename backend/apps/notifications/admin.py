from django.contrib import admin

from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "notification_type",
        "user",
        "organization",
        "is_read",
        "entity_type",
        "created_at",
    ]
    list_filter = ["notification_type", "is_read", "organization"]
    search_fields = ["title", "message", "user__email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "order_notifications",
        "product_notifications",
        "store_notifications",
        "billing_notifications",
        "system_notifications",
        "ai_notifications",
        "email_notifications",
        "push_notifications",
    ]
    list_filter = [
        "order_notifications",
        "product_notifications",
        "email_notifications",
        "push_notifications",
    ]
    search_fields = ["user__email", "user__first_name", "user__last_name"]
    readonly_fields = ["created_at", "updated_at"]
