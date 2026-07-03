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


class TestCartViewSet:
    def _create_cart(self, api_client, email="cart-test@example.com"):
        from apps.orders.models import Cart
        from apps.products.models import Product

        user, org, store, token = create_org_with_owner_and_store(email)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        product = Product.objects.create(
            organization=org,
            store=store,
            title="Cart Test Product",
            slug="cart-test-product",
            price=Decimal("15.00"),
            sku="CT-001",
            status="active",
            track_inventory=True,
            inventory_quantity=20,
        )
        cart = Cart.objects.create(organization=org, store=store, customer=None)
        return api_client, cart, product, org, store

    def test_add_item(self, api_client):
        client, cart, product, org, store = self._create_cart(api_client, "cart-add@example.com")
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": 2},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_items"] == 2

    def test_add_item_invalid_quantity(self, api_client):
        client, cart, product, org, store = self._create_cart(
            api_client, "cart-inv-qty@example.com"
        )
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": "abc"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_add_item_product_not_found(self, api_client):
        client, cart, product, org, store = self._create_cart(
            api_client, "cart-notfound@example.com"
        )
        import uuid

        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(uuid.uuid4()), "quantity": 1},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_add_item_increments_quantity(self, api_client):
        client, cart, product, org, store = self._create_cart(api_client, "cart-incr@example.com")
        client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": 1},
            format="json",
        )
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": 3},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_items"] == 4

    def test_update_item(self, api_client):
        from apps.orders.models import CartItem

        client, cart, product, org, store = self._create_cart(api_client, "cart-update@example.com")
        client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": 1},
            format="json",
        )
        item = CartItem.objects.get(cart=cart, product=product)
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/items/update/",
            {"item_id": str(item.id), "quantity": 5},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_items"] == 5

    def test_update_item_not_found(self, api_client):
        client, cart, product, org, store = self._create_cart(api_client, "cart-upd-nf@example.com")
        import uuid

        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/items/update/",
            {"item_id": str(uuid.uuid4()), "quantity": 1},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_item_zero_quantity_deletes(self, api_client):
        from apps.orders.models import CartItem

        client, cart, product, org, store = self._create_cart(api_client, "cart-del@example.com")
        client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": 1},
            format="json",
        )
        item = CartItem.objects.get(cart=cart, product=product)
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/items/update/",
            {"item_id": str(item.id), "quantity": 0},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_items"] == 0

    def test_remove_item(self, api_client):
        from apps.orders.models import CartItem

        client, cart, product, org, store = self._create_cart(api_client, "cart-remove@example.com")
        client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": 1},
            format="json",
        )
        item = CartItem.objects.get(cart=cart, product=product)
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/items/remove/",
            {"item_id": str(item.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_items"] == 0

    def test_checkout_empty_cart(self, api_client):
        client, cart, product, org, store = self._create_cart(
            api_client, "cart-empty-checkout@example.com"
        )
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/checkout/",
            {"customer_email": "customer@test.com"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_checkout_missing_email(self, api_client):
        client, cart, product, org, store = self._create_cart(
            api_client, "cart-no-email@example.com"
        )
        client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": 1},
            format="json",
        )
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/checkout/",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_checkout_success(self, api_client):
        client, cart, product, org, store = self._create_cart(
            api_client, "cart-checkout-ok@example.com"
        )
        client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": 2},
            format="json",
        )
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/checkout/",
            {"customer_email": "buyer@test.com", "customer_first_name": "Buyer"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["customer_email"] == "buyer@test.com"

        from apps.orders.models import Order

        order = Order.objects.get(id=response.data["id"])
        assert order.status == "pending"

        product.refresh_from_db()
        assert product.inventory_quantity == 18
        assert product.total_sold == 2

    def test_checkout_insufficient_stock(self, api_client):
        client, cart, product, org, store = self._create_cart(
            api_client, "cart-no-stock@example.com"
        )
        product.inventory_quantity = 1
        product.save(update_fields=["inventory_quantity"])
        client.post(
            f"/api/v1/orders/carts/{cart.id}/items/add/",
            {"product": str(product.id), "quantity": 5},
            format="json",
        )
        response = client.post(
            f"/api/v1/orders/carts/{cart.id}/checkout/",
            {"customer_email": "buyer@test.com"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cart_list(self, api_client):
        from apps.orders.models import Cart

        user, org, store, token = create_org_with_owner_and_store("cart-list@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Cart.objects.create(organization=org, store=store)
        response = api_client.get(f"/api/v1/orders/carts/?store={store.id}")
        assert response.status_code == status.HTTP_200_OK

    def test_cart_list_by_store(self, api_client):
        from apps.orders.models import Cart

        user, org, store, token = create_org_with_owner_and_store("cart-filter@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Cart.objects.create(organization=org, store=store)
        response = api_client.get(f"/api/v1/orders/carts/?store={store.id}")
        assert response.status_code == status.HTTP_200_OK


class TestOrderViewSetActions:
    def test_update_payment_status(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("pay-update@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="confirmed",
            payment_status="pending",
            subtotal=Decimal("50.00"),
            total=Decimal("50.00"),
        )
        response = api_client.post(
            f"/api/v1/orders/orders/{order.id}/update_payment_status/",
            {"payment_status": "paid"},
        )
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.payment_status == "paid"

    def test_update_payment_status_invalid(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("pay-invalid@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="confirmed",
            subtotal=Decimal("50.00"),
            total=Decimal("50.00"),
        )
        response = api_client.post(
            f"/api/v1/orders/orders/{order.id}/update_payment_status/",
            {"payment_status": "invalid_status"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_ship_order(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("ship-test@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="processing",
            subtotal=Decimal("50.00"),
            total=Decimal("50.00"),
        )
        response = api_client.post(
            f"/api/v1/orders/orders/{order.id}/ship/",
            {"tracking_number": "TRACK123", "tracking_url": "https://track.example.com/TRACK123"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == "shipped"
        assert order.tracking_number == "TRACK123"

    def test_deliver_order(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("deliver-test@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="shipped",
            subtotal=Decimal("50.00"),
            total=Decimal("50.00"),
        )
        response = api_client.post(f"/api/v1/orders/orders/{order.id}/deliver/")
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == "delivered"

    def test_cancel_order(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("cancel-ord@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="confirmed",
            subtotal=Decimal("50.00"),
            total=Decimal("50.00"),
        )
        response = api_client.post(f"/api/v1/orders/orders/{order.id}/cancel/")
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == "cancelled"

    def test_add_note(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("add-note@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="confirmed",
            subtotal=Decimal("50.00"),
            total=Decimal("50.00"),
        )
        response = api_client.post(
            f"/api/v1/orders/orders/{order.id}/add_note/",
            {"note_type": "internal", "note": "Call customer before shipping"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.internal_notes == "Call customer before shipping"

    def test_add_customer_note(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("cust-note@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        order = Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="confirmed",
            subtotal=Decimal("50.00"),
            total=Decimal("50.00"),
        )
        response = api_client.post(
            f"/api/v1/orders/orders/{order.id}/add_note/",
            {"note_type": "customer", "note": "Leave at door"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.customer_notes == "Leave at door"

    def test_order_list_filtering(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("order-filter@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Order.objects.create(
            organization=org,
            store=store,
            customer_email="c@test.com",
            status="pending",
            subtotal=Decimal("10.00"),
            total=Decimal("10.00"),
        )
        Order.objects.create(
            organization=org,
            store=store,
            customer_email="d@test.com",
            status="shipped",
            subtotal=Decimal("20.00"),
            total=Decimal("20.00"),
        )
        response = api_client.get("/api/v1/orders/orders/?status=pending")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_order_list_search(self, api_client):
        from apps.orders.models import Order

        user, org, store, token = create_org_with_owner_and_store("order-search@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        Order.objects.create(
            organization=org,
            store=store,
            customer_email="john@test.com",
            customer_first_name="John",
            status="pending",
            subtotal=Decimal("10.00"),
            total=Decimal("10.00"),
        )
        response = api_client.get("/api/v1/orders/orders/?search=john")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
