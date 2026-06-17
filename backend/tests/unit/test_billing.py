from decimal import Decimal

from django.test import TestCase

from apps.billing.models import Invoice, PaymentMethod, Plan, Subscription


class TestPlanModel(TestCase):
    def test_create_plan(self):
        plan = Plan.objects.create(
            name="Pro",
            slug="pro",
            price=Decimal("29.99"),
            max_products=1000,
            max_orders=10000,
        )
        self.assertIn("Pro", str(plan))
        self.assertIn("29.99", str(plan))


class TestSubscriptionModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization

        self.user = User.objects.create_user(email="sub@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test Sub", slug="test-sub-org")
        self.plan = Plan.objects.create(
            name="Basic",
            slug="basic",
            price=Decimal("9.99"),
        )

    def test_create_subscription(self):
        sub = Subscription.objects.create(organization=self.org, plan=self.plan, status="active")
        self.assertEqual(sub.status, "active")
        self.assertIn("Basic", str(sub))


class TestInvoiceModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization

        self.user = User.objects.create_user(email="inv@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test Inv", slug="test-inv-org")

    def test_create_invoice(self):
        inv = Invoice.objects.create(
            organization=self.org,
            amount=Decimal("29.99"),
            invoice_number="INV-001",
            status="paid",
        )
        self.assertIn("INV-001", str(inv))


class TestPaymentMethodModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization

        self.user = User.objects.create_user(email="pm@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test PM", slug="test-pm-org")

    def test_create_payment_method(self):
        pm = PaymentMethod.objects.create(
            organization=self.org,
            method_type="card",
            last_four="4242",
            brand="Visa",
            exp_month=12,
            exp_year=2027,
            is_default=True,
        )
        self.assertEqual(str(pm), "Visa ****4242")
