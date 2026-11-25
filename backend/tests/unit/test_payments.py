from decimal import Decimal

import pytest
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


@pytest.fixture
def order_data(db):
    from apps.products.models import Product

    user, org, store, token = create_org_with_owner_and_store("pay@example.com")
    product = Product.objects.create(
        organization=org,
        store=store,
        title="Paid Widget",
        slug="paid-widget",
        product_type="physical",
        status="active",
        price=Decimal("100.00"),
        sku="PW-001",
        track_inventory=False,
    )
    return {
        "user": user,
        "org": org,
        "store": store,
        "token": token,
        "product": product,
    }


def make_order(org, store, subtotal=Decimal("100.00")):
    from apps.orders.models import Order

    return Order.objects.create(
        organization=org,
        store=store,
        customer_email="payer@example.com",
        subtotal=subtotal,
        total=subtotal,
        payment_status="pending",
        status="pending",
        payment_method="card",
    )


class FakeSession:
    def __init__(self, url="https://checkout.stripe.com/c/pay/cs_test_123"):
        self.id = "cs_test_123"
        self.url = url


class TestStripeCheckout:
    @override_settings(STRIPE_SECRET_KEY="sk_test_x")
    def test_session_created_for_unpaid_order(self, order_data, monkeypatch):
        from apps.payments.services import create_stripe_checkout

        order = make_order(order_data["org"], order_data["store"])
        monkeypatch.setattr("stripe.checkout.Session.create", lambda **kwargs: FakeSession())
        url, payment = create_stripe_checkout(
            order,
            success_url="https://store.test/thanks",
            cancel_url="https://store.test/cart",
        )
        assert url.startswith("https://checkout.stripe.com")
        assert payment.status == "pending"
        assert payment.provider_ref == "cs_test_123"
        assert str(payment.order_id) == str(order.id)

    @override_settings(STRIPE_SECRET_KEY="sk_test_x")
    def test_endpoint_returns_payment_url(self, order_data, monkeypatch):
        client = APIClient()
        order = make_order(order_data["org"], order_data["store"])
        monkeypatch.setattr("stripe.checkout.Session.create", lambda **kwargs: FakeSession())
        response = client.post(
            f"/api/v1/payments/stripe/{order_data['store'].slug}/create/",
            {
                "order_id": str(order.id),
                "success_url": "https://x.test/s",
                "cancel_url": "https://x.test/c",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert "payment_url" in response.data

    def test_endpoint_400_when_stripe_not_configured(self, order_data):
        client = APIClient()
        order = make_order(order_data["org"], order_data["store"])
        response = client.post(
            f"/api/v1/payments/stripe/{order_data['store'].slug}/create/",
            {"order_id": str(order.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @override_settings(STRIPE_SECRET_KEY="sk_test_x")
    def test_config_reports_card_available(self, order_data):
        client = APIClient()
        response = client.get(f"/api/v1/payments/config/{order_data['store'].slug}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["card"] is True
        assert response.data["cod"] is True


class TestWebhook:
    def _event(self, order_id: str, event_type="checkout.session.completed"):
        return {
            "type": event_type,
            "data": {
                "object": {
                    "id": "cs_test_123",
                    "client_reference_id": order_id,
                    "metadata": {"order_id": order_id},
                }
            },
        }

    def test_completed_marks_order_paid(self, order_data, monkeypatch, settings):
        settings.STRIPE_WEBHOOK_SECRET = "whsec_test"
        import json

        from django.test import RequestFactory

        from apps.payments.views import stripe_webhook

        order = make_order(order_data["org"], order_data["store"])

        monkeypatch.setattr(
            "stripe.Webhook.construct_event",
            lambda payload, sig, secret: json.loads(payload),
        )

        factory = RequestFactory()
        event = self._event(str(order.id))
        request = factory.post(
            "/api/v1/payments/stripe/webhook/",
            data=json.dumps(event),
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="sig",
        )
        response = stripe_webhook(request)
        assert response.status_code == 200

        order.refresh_from_db()
        assert order.payment_status == "paid"
        assert order.status == "confirmed"

    def test_invalid_signature_rejected(self, order_data, monkeypatch, settings):
        settings.STRIPE_WEBHOOK_SECRET = "whsec_test"
        from django.test import RequestFactory

        from apps.payments.views import stripe_webhook

        monkeypatch.setattr(
            "stripe.Webhook.construct_event",
            lambda payload, sig, secret: (_ for _ in ()).throw(ValueError("bad sig")),
        )
        factory = RequestFactory()
        request = factory.post(
            "/api/v1/payments/stripe/webhook/",
            data="{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="bad",
        )
        response = stripe_webhook(request)
        assert response.status_code == 400

    def test_idempotent(self, order_data, monkeypatch, settings):
        settings.STRIPE_WEBHOOK_SECRET = "whsec_test"
        import json

        from django.test import RequestFactory

        from apps.payments.models import Payment
        from apps.payments.views import stripe_webhook

        order = make_order(order_data["org"], order_data["store"])
        monkeypatch.setattr(
            "stripe.Webhook.construct_event",
            lambda payload, sig, secret: json.loads(payload),
        )
        factory = RequestFactory()
        event = self._event(str(order.id))
        request = factory.post(
            "/api/v1/payments/stripe/webhook/",
            data=json.dumps(event),
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="sig",
        )
        stripe_webhook(request)
        stripe_webhook(request)

        assert Payment.unscoped.filter(order=order).count() == 1
        order.refresh_from_db()
        assert order.payment_status == "paid"

    def test_expired_session_fails_payment(self, order_data, monkeypatch, settings):
        settings.STRIPE_WEBHOOK_SECRET = "whsec_test"
        import json

        from django.test import RequestFactory

        from apps.orders.models import Order
        from apps.payments.services import create_stripe_checkout
        from apps.payments.views import stripe_webhook

        order = make_order(order_data["org"], order_data["store"])
        monkeypatch.setattr("stripe.checkout.Session.create", lambda **kwargs: FakeSession())
        _, payment = create_stripe_checkout(
            order, success_url="https://x/s", cancel_url="https://x/c"
        )
        monkeypatch.setattr(
            "stripe.Webhook.construct_event",
            lambda payload, sig, secret: json.loads(payload),
        )
        factory = RequestFactory()
        event = self._event(str(order.id), event_type="checkout.session.expired")
        request = factory.post(
            "/api/v1/payments/stripe/webhook/",
            data=json.dumps(event),
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="sig",
        )
        response = stripe_webhook(request)
        assert response.status_code == 200
        payment.refresh_from_db()
        assert payment.status == "failed"
        order.refresh_from_db()
        assert order.payment_status == "pending"

        # Order remains payable
        assert Order.unscoped.filter(id=order.id, payment_status="pending").exists()
