from __future__ import annotations

from django.db.models import Q

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
        self._log_audit(action="customer.create", resource_type="customer", resource_id=customer.id, new_value=CustomerSerializer(customer).data)

    def perform_update(self, serializer):
        old_data = CustomerSerializer(serializer.instance).data
        customer = serializer.save()
        self._log_audit(action="customer.update", resource_type="customer", resource_id=customer.id, old_value=old_data, new_value=CustomerSerializer(customer).data)

    def perform_destroy(self, instance):
        self._log_audit(action="customer.delete", resource_type="customer", resource_id=instance.id, old_value=CustomerSerializer(instance).data)
        instance.delete()
