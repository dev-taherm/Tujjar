import pytest
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


class TestOrdersExport:
    def test_export_csv_with_guest_orders(self, db):
        """Guest orders (customer=None) must not break the export."""
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("csvexp@example.com")
        Order.objects.create(
            organization=org,
            store=store,
            customer_email="guest@example.com",
            subtotal=10,
            total=10,
        )
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/v1/orders/orders/export/")
        assert response.status_code == status.HTTP_200_OK
        body = response.content.decode("utf-8")
        assert "order_number" in body
        assert "guest@example.com" in body
