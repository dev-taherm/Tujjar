from __future__ import annotations

from rest_framework import serializers

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id", "organization", "store", "user", "email",
            "first_name", "last_name", "full_name", "phone", "company",
            "address_line1", "address_line2", "city", "state",
            "postal_code", "country",
            "orders_count", "total_spent", "loyalty_points",
            "tags", "notes", "is_verified",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "organization", "orders_count", "total_spent",
            "loyalty_points", "created_at", "updated_at",
        ]
