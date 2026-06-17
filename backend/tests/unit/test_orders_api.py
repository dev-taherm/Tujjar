from decimal import Decimal

import pytest
from rest_framework import status

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


class TestOrderStatusTransition:
    def test_valid_transition_pending_to_confirmed(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("trans1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="pending",
            subtotal=Decimal("10.00"),
            total=Decimal("10.00"),
        )
        response = api_client.post(
            f"/api/v1/orders/orders/{order.id}/update_status/", {"status": "confirmed"}
        )
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == "confirmed"

    def test_invalid_transition_delivered_to_pending(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("trans2@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="delivered",
            subtotal=Decimal("10.00"),
            total=Decimal("10.00"),
        )
        response = api_client.post(
            f"/api/v1/orders/orders/{order.id}/update_status/", {"status": "pending"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_timeline_endpoint(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("trans3@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="pending",
            subtotal=Decimal("10.00"),
            total=Decimal("10.00"),
        )
        order.transition_status("confirmed")
        order.transition_status("processing")

        response = api_client.get(f"/api/v1/orders/orders/{order.id}/timeline/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2


class TestOrderCancelRestoresInventory:
    def test_cancel_restores_inventory(self, api_client):
        from apps.orders.models import Order, OrderItem
        from apps.products.models import Product

        user, org, store, token = create_org_with_owner_and_store("cancel1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        product = Product.objects.create(
            organization=org,
            store=store,
            title="Test Product",
            price=Decimal("25.00"),
            sku="TP-001",
            status="active",
            track_inventory=True,
            inventory_quantity=10,
            total_sold=5,
            total_revenue=Decimal("125.00"),
        )
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="confirmed",
            subtotal=Decimal("50.00"),
            total=Decimal("50.00"),
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            title="Test Product",
            quantity=3,
            unit_price=Decimal("25.00"),
            total_price=Decimal("75.00"),
        )
        order.cancel()
        product.refresh_from_db()
        assert product.inventory_quantity == 13
        assert product.total_sold == 2
