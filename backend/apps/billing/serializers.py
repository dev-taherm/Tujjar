from __future__ import annotations

from rest_framework import serializers

from apps.billing.models import Invoice, PaymentMethod, Plan, Subscription


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "currency",
            "interval",
            "trial_days",
            "max_products",
            "max_orders",
            "max_storage_gb",
            "max_ai_generations",
            "features",
            "is_active",
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    plan_price = serializers.DecimalField(
        source="plan.price", max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan",
            "plan_name",
            "plan_price",
            "status",
            "current_period_start",
            "current_period_end",
            "cancel_at",
            "canceled_at",
            "trial_start",
            "trial_end",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            "id",
            "status",
            "amount",
            "currency",
            "description",
            "invoice_number",
            "due_date",
            "paid_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            "id",
            "method_type",
            "last_four",
            "brand",
            "exp_month",
            "exp_year",
            "is_default",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CreateCheckoutSessionSerializer(serializers.Serializer):
    plan_slug = serializers.SlugField()
    success_url = serializers.URLField()
    cancel_url = serializers.URLField()


class CreatePortalSessionSerializer(serializers.Serializer):
    return_url = serializers.URLField()
