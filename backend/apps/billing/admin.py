from django.contrib import admin

from .models import Invoice, PaymentMethod, Plan, Subscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "slug",
        "price",
        "currency",
        "interval",
        "trial_days",
        "max_products",
        "max_orders",
        "is_active",
        "is_system",
        "created_at",
    ]
    list_filter = ["interval", "is_active", "is_system"]
    search_fields = ["name", "slug", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "organization",
        "plan",
        "status",
        "current_period_start",
        "current_period_end",
        "trial_end",
        "created_at",
    ]
    list_filter = ["status", "plan"]
    search_fields = ["organization__name", "external_subscription_id"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_number",
        "organization",
        "subscription",
        "status",
        "amount",
        "currency",
        "due_date",
        "paid_at",
        "created_at",
    ]
    list_filter = ["status", "currency"]
    search_fields = ["invoice_number", "organization__name", "external_invoice_id"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = [
        "organization",
        "method_type",
        "brand",
        "last_four",
        "exp_month",
        "exp_year",
        "is_default",
        "created_at",
    ]
    list_filter = ["method_type", "brand", "is_default"]
    search_fields = ["organization__name", "brand", "last_four"]
    readonly_fields = ["created_at", "updated_at"]
