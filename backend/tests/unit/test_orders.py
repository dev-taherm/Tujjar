import pytest
from django.test import TestCase
from decimal import Decimal

from apps.orders.models import Order, OrderItem, Cart, CartItem


class TestOrderModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store
        from apps.customers.models import Customer
        self.user = User.objects.create_user(email="order@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test Order", slug="test-order-org")
        self.store = Store.objects.create(
            organization=self.org, name="Order Store", slug="order-store",
        )
        self.customer = Customer.objects.create(
            organization=self.org, store=self.store,
            email="cust@test.com", first_name="Cust", last_name="Omer",
        )
    
    def test_create_order(self):
        order = Order.objects.create(
            organization=self.org, store=self.store, customer=self.customer,
            order_number="ORD-001", status="pending",
            subtotal=Decimal("100.00"), tax_amount=Decimal("8.00"),
            total=Decimal("108.00"), customer_email="cust@test.com",
        )
        self.assertIn("ORD-001", str(order))

    def test_order_status_choices(self):
        order = Order.objects.create(
            organization=self.org, store=self.store,
            order_number="ORD-002", status="pending",
            subtotal=Decimal("50"), tax_amount=Decimal("4"),
            total=Decimal("54"), customer_email="cust2@test.com",
        )
        self.assertEqual(order.status, "pending")


class TestCartModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store
        self.user = User.objects.create_user(email="cart@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test Cart", slug="test-cart-org")
        self.store = Store.objects.create(
            organization=self.org, name="Cart Store", slug="cart-store",
        )
    
    def test_create_cart(self):
        cart = Cart.objects.create(
            organization=self.org, store=self.store,
        )
        self.assertIsNotNone(cart.id)
        self.assertEqual(cart.status, "active")
