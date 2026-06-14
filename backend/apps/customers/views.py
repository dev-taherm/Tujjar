from __future__ import annotations

from django.db.models import Q
from rest_framework import viewsets

from apps.audit.models import log_action
from apps.core.viewsets import TenantViewSet

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(TenantViewSet):
    """Customer CRUD with search."""

    serializer_class = CustomerSerializer
    required_permission = "customers.manage"

    def get_queryset(self):
        qs = Customer.objects.select_related("store").filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        customer = serializer.save(organization_id=self.request.org_id)
        log_action(
            action="customer.create",
            resource_type="customer",
            resource_id=customer.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            new_value=CustomerSerializer(customer).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )
