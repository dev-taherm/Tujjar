import pytest
from decimal import Decimal
from rest_framework import status

pytestmark = pytest.mark.django_db


def _get_auth_token(client, email="order-test@example.com"):
    from apps.authentication.models import User
    from apps.organizations.models import Organization, OrganizationMembership, Role
    from apps.stores.models import Store

    user = User.objects.create_user(email=email, password="testpass123", is_verified=True)
    org = Organization.objects.create(name="Order Test Org", slug=f"org-{email.split('@')[0]}")
    role, _ = Role.objects.get_or_create(slug="owner", organization=None, defaults={"name": "Owner", "is_system": True})
    OrganizationMembership.objects.create(user=user, organization=org, role=role, is_accepted=True)
    store = Store.objects.create(organization=org, name="Test Store", slug=f"store-{email.split('@')[0]}")

    response = client.post("/api/v1/auth/login/", {"email": email, "password": "testpass123"})
    return response.data["access"], org, store


class TestOrderStatusTransition:
    def test_valid_transition_pending_to_confirmed(self, api_client):
        from apps.orders.models import Order

        token, org, store = _get_auth_token(api_client, "trans1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org, store=store, customer_email="c@test.com",
            status="pending", subtotal=Decimal("10.00"), total=Decimal("10.00"),
        )
        response = api_client.post(f"/api/v1/orders/orders/{order.id}/update_status/", {"status": "confirmed"})
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == "confirmed"

    def test_invalid_transition_delivered_to_pending(self, api_client):
        from apps.orders.models import Order

        token, org, store = _get_auth_token(api_client, "trans2@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org, store=store, customer_email="c@test.com",
            status="delivered", subtotal=Decimal("10.00"), total=Decimal("10.00"),
        )
        response = api_client.post(f"/api/v1/orders/orders/{order.id}/update_status/", {"status": "pending"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_timeline_endpoint(self, api_client):
        from apps.orders.models import Order, OrderStatusHistory

        token, org, store = _get_auth_token(api_client, "trans3@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org, store=store, customer_email="c@test.com",
            status="pending", subtotal=Decimal("10.00"), total=Decimal("10.00"),
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

        token, org, store = _get_auth_token(api_client, "cancel1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        product = Product.objects.create(
            organization=org, store=store, title="Test Product",
            price=Decimal("25.00"), sku="TP-001", status="active",
            track_inventory=True, inventory_quantity=10, total_sold=5,
            total_revenue=Decimal("125.00"),
        )
        order = Order.objects.create(
            organization=org, store=store, customer_email="c@test.com",
            status="confirmed", subtotal=Decimal("50.00"), total=Decimal("50.00"),
        )
        OrderItem.objects.create(
            order=order, product=product, title="Test Product",
            quantity=3, unit_price=Decimal("25.00"), total_price=Decimal("75.00"),
        )
        order.cancel()
        product.refresh_from_db()
        assert product.inventory_quantity == 13
        assert product.total_sold == 2
