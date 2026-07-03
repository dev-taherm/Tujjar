from decimal import Decimal

import pytest
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.billing.models import Invoice, PaymentMethod, Plan, Subscription
from apps.billing.views import check_plan_limits
from tests.factories import create_org_with_owner

pytestmark = pytest.mark.django_db


class TestCheckPlanLimits(TestCase):
    def test_no_subscription(self):
        user, org, _ = create_org_with_owner("limits1@test.com")
        result = check_plan_limits(org, "products")
        assert result["exceeded"] is False

    def test_under_limit(self):
        user, org, _ = create_org_with_owner("limits2@test.com")
        plan = Plan.objects.create(
            name="Pro", slug="pro-limits", price=Decimal("29.99"), max_products=100, max_orders=1000
        )
        Subscription.objects.create(organization=org, plan=plan, status="active")
        result = check_plan_limits(org, "products")
        assert result["exceeded"] is False
        assert result["limit"] == 100

    def test_unknown_resource_type(self):
        user, org, _ = create_org_with_owner("limits3@test.com")
        plan = Plan.objects.create(
            name="Pro",
            slug="pro-limits2",
            price=Decimal("29.99"),
            max_products=100,
            max_orders=1000,
        )
        Subscription.objects.create(organization=org, plan=plan, status="active")
        result = check_plan_limits(org, "unknown")
        assert result["current"] == 0
        assert result["limit"] == 0


class TestPlanViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.token = create_org_with_owner("plan@test.com")
        self.plan = Plan.objects.create(
            name="Starter", slug="starter", price=Decimal("9.99"), is_active=True
        )
        Plan.objects.create(name="Inactive", slug="inactive", price=Decimal("0"), is_active=False)

    def test_list_plans(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get("/api/v1/billing/plans/")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_plan(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(f"/api/v1/billing/plans/{self.plan.id}/")
        assert response.status_code == status.HTTP_200_OK


class TestSubscriptionViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.token = create_org_with_owner("sub@test.com")
        self.plan = Plan.objects.create(
            name="Pro", slug="pro-sub", price=Decimal("29.99"), trial_days=14
        )

    def test_list_subscriptions(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get("/api/v1/billing/subscription/")
        assert response.status_code == status.HTTP_200_OK

    def test_checkout_creates_subscription(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.post(
            "/api/v1/billing/subscription/checkout/",
            {
                "plan_slug": "pro-sub",
                "success_url": "http://example.com/success",
                "cancel_url": "http://example.com/cancel",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert Subscription.objects.filter(organization=self.org).exists()

    def test_checkout_creates_invoice(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.client.post(
            "/api/v1/billing/subscription/checkout/",
            {
                "plan_slug": "pro-sub",
                "success_url": "http://example.com/success",
                "cancel_url": "http://example.com/cancel",
            },
            format="json",
        )
        assert Invoice.objects.filter(organization=self.org).exists()

    def test_cancel_no_subscription(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.post("/api/v1/billing/subscription/cancel/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cancel_active_subscription(self):
        sub = Subscription.objects.create(organization=self.org, plan=self.plan, status="active")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.post("/api/v1/billing/subscription/cancel/")
        assert response.status_code == status.HTTP_200_OK
        sub.refresh_from_db()
        assert sub.status == "canceled"


class TestInvoiceViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.token = create_org_with_owner("inv@test.com")
        self.invoice = Invoice.objects.create(
            organization=self.org,
            amount=Decimal("29.99"),
            invoice_number="INV-TEST",
            status="paid",
        )

    def test_list_invoices(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get("/api/v1/billing/invoices/")
        assert response.status_code == status.HTTP_200_OK


class TestPaymentMethodViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.token = create_org_with_owner("pm@test.com")
        self.pm = PaymentMethod.objects.create(
            organization=self.org,
            method_type="card",
            last_four="4242",
            brand="Visa",
            exp_month=12,
            exp_year=2027,
            is_default=True,
        )

    def test_list_payment_methods(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get("/api/v1/billing/payment-methods/")
        assert response.status_code == status.HTTP_200_OK

    def test_set_default(self):
        pm2 = PaymentMethod.objects.create(
            organization=self.org,
            method_type="card",
            last_four="1234",
            brand="Mastercard",
            exp_month=6,
            exp_year=2028,
            is_default=False,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.post(f"/api/v1/billing/payment-methods/{pm2.id}/set_default/")
        assert response.status_code == status.HTTP_200_OK
        pm2.refresh_from_db()
        self.pm.refresh_from_db()
        assert pm2.is_default is True
        assert self.pm.is_default is False


class TestCheckTrialExpiry:
    def test_expired_trials_updated(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.billing.models import Plan, Subscription
        from apps.billing.tasks import check_trial_expiry
        from tests.factories import create_org_with_owner

        user, org, _ = create_org_with_owner("trial-expiry@example.com")
        plan = Plan.objects.create(
            name="Trial Plan", slug="trial-plan", price=Decimal("0"), trial_days=14
        )
        sub = Subscription.objects.create(
            organization=org,
            plan=plan,
            status="trialing",
            trial_end=timezone.now() - timedelta(days=1),
        )
        result = check_trial_expiry()
        sub.refresh_from_db()
        assert sub.status == "past_due"
        assert "1" in result

    def test_non_expired_trials_not_affected(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.billing.models import Plan, Subscription
        from apps.billing.tasks import check_trial_expiry
        from tests.factories import create_org_with_owner

        user, org, _ = create_org_with_owner("trial-active@example.com")
        plan = Plan.objects.create(
            name="Active Trial", slug="active-trial", price=Decimal("0"), trial_days=14
        )
        sub = Subscription.objects.create(
            organization=org,
            plan=plan,
            status="trialing",
            trial_end=timezone.now() + timedelta(days=5),
        )
        result = check_trial_expiry()
        sub.refresh_from_db()
        assert sub.status == "trialing"
        assert "0" in result

    def test_no_expired_trials(self):
        from apps.billing.tasks import check_trial_expiry

        result = check_trial_expiry()
        assert "0" in result
