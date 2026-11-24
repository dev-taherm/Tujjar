import contextlib
import hashlib
import hmac
import json

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


@pytest.fixture
def hook_data(db):
    user, org, store, token = create_org_with_owner_and_store("hooks@example.com")
    return {"org": org, "store": store, "token": token}


def make_endpoint(org, url="https://merchant.example/hook", events=None):
    from apps.webhooks.models import WebhookEndpoint

    return WebhookEndpoint.objects.create(
        organization=org,
        url=url,
        events=events or ["*"],
        is_active=True,
    )


def make_order(org, store):
    from apps.orders.models import Order

    return Order.objects.create(
        organization=org,
        store=store,
        customer_email="hooked@example.com",
        subtotal=Decimal("80.00"),
        total=Decimal("80.00"),
        payment_status="paid",
        status="confirmed",
    )


from decimal import Decimal  # noqa: E402


class TestSignature:
    def test_signature_is_hmac_sha256(self, hook_data):
        from apps.webhooks.models import WebhookDelivery
        from apps.webhooks.services import build_request

        endpoint = make_endpoint(hook_data["org"])
        order = make_order(hook_data["org"], hook_data["store"])
        delivery = WebhookDelivery.objects.create(
            organization=hook_data["org"],
            endpoint=endpoint,
            event_type="order.paid",
            payload={"order_number": order.order_number},
        )
        body, headers = build_request(delivery)

        expected = hmac.new(
            endpoint.secret.encode(), body, hashlib.sha256
        ).hexdigest()
        assert headers["X-Tujjar-Signature"] == f"sha256={expected}"
        assert headers["X-Tujjar-Event"] == "order.paid"
        parsed = json.loads(body)
        assert parsed["type"] == "order.paid"
        assert parsed["data"]["order_number"] == order.order_number


class TestDispatch:
    def test_event_filtering(self, hook_data):
        from apps.webhooks.models import WebhookDelivery
        from apps.webhooks.services import dispatch_event

        only_paid = make_endpoint(hook_data["org"], "https://a.example/h", ["order.paid"])
        catch_all = make_endpoint(hook_data["org"], "https://b.example/h", ["*"])

        dispatch_event(hook_data["org"].id, "order.refunded", {"x": 1})

        assert WebhookDelivery.unscoped.filter(endpoint=only_paid).count() == 0
        assert WebhookDelivery.unscoped.filter(endpoint=catch_all).count() == 1
        delivery = WebhookDelivery.unscoped.filter(endpoint=catch_all).first()
        assert delivery.event_type == "order.refunded"

    def test_order_creation_dispatches_webhook(self, hook_data, monkeypatch):
        """create_order_from_quote fans out order.created deliveries."""
        from apps.commerce.services import OrderLine, QuoteResult, create_order_from_quote
        from apps.products.models import Product
        from apps.webhooks.models import WebhookDelivery

        product = Product.objects.create(
            organization=hook_data["org"],
            store=hook_data["store"],
            title="Hook Widget",
            slug="hook-widget",
            product_type="physical",
            status="active",
            price=Decimal("80.00"),
            sku="HW-1",
            track_inventory=False,
        )

        calls = []
        monkeypatch.setattr(
            "apps.webhooks.tasks.deliver_webhook.delay",
            staticmethod(lambda delivery_id: calls.append(delivery_id)),
        )
        make_endpoint(hook_data["org"], "https://c.example/h", ["order.created"])

        quote = QuoteResult(subtotal=Decimal("80"), total=Decimal("80"))
        line = OrderLine(
            product_id=str(product.id), variant_id=None, title=product.title, sku=product.sku,
            quantity=1, unit_price=Decimal("80"), line_total=Decimal("80"),
        )
        create_order_from_quote(
            hook_data["store"], quote=quote, lines=[line], customer_email="x@y.z"
        )

        deliveries = WebhookDelivery.unscoped.filter(event_type="order.created")
        assert deliveries.count() >= 1
        assert len(calls) >= 1

    def test_mark_paid_dispatches_order_paid(self, hook_data, monkeypatch):
        from apps.payments.services import mark_order_paid
        from apps.webhooks.models import WebhookDelivery

        calls = []
        monkeypatch.setattr(
            "apps.webhooks.tasks.deliver_webhook.delay",
            staticmethod(lambda delivery_id: calls.append(delivery_id)),
        )
        make_endpoint(hook_data["org"], "https://d.example/h", ["order.paid"])
        order = make_order(hook_data["org"], hook_data["store"])
        order.payment_status = "pending"
        order.save(update_fields=["payment_status"])

        mark_order_paid(order, provider="stripe", provider_ref="cs_1")

        deliveries = WebhookDelivery.unscoped.filter(event_type="order.paid")
        assert deliveries.count() == 1


class TestDeliveryTask:
    def test_successful_delivery(self, hook_data, monkeypatch):
        from apps.webhooks.models import WebhookDelivery
        from apps.webhooks.tasks import deliver_webhook

        endpoint = make_endpoint(hook_data["org"])
        delivery = WebhookDelivery.objects.create(
            organization=hook_data["org"],
            endpoint=endpoint,
            event_type="order.created",
            payload={"x": 1},
        )

        captured = {}

        class FakeResponse:
            status_code = 200

        monkeypatch.setattr(
            "requests.post",
            lambda url, data=None, headers=None, timeout=None: captured.update(
                {"url": url, "headers": headers, "body": data}
            )
            or FakeResponse(),
        )
        deliver_webhook(delivery.id)

        delivery.refresh_from_db()
        assert delivery.status == "succeeded"
        assert delivery.attempts == 1
        assert captured["headers"]["X-Tujjar-Event"] == "order.created"
        # Body is valid JSON signed with the endpoint secret
        body = json.loads(captured["body"].decode())
        sig = captured["headers"]["X-Tujjar-Signature"].split("=", 1)[1]
        expected = hmac.new(endpoint.secret.encode(), captured["body"], hashlib.sha256).hexdigest()
        assert sig == expected
        assert body["data"]["x"] == 1

    def test_retry_then_fail(self, hook_data, monkeypatch):
        from apps.webhooks.models import WebhookDelivery
        from apps.webhooks.tasks import deliver_webhook

        endpoint = make_endpoint(hook_data["org"])
        delivery = WebhookDelivery.objects.create(
            organization=hook_data["org"],
            endpoint=endpoint,
            event_type="order.created",
            payload={},
        )

        class FakeResponse:
            status_code = 500

        monkeypatch.setattr("requests.post", lambda *a, **k: FakeResponse())
        retried = []
        monkeypatch.setattr(
            "celery.Task.retry",
            lambda self, *a, **k: retried.append(1) or (_ for _ in ()).throw(Exception("retry")),
        )

        with contextlib.suppress(Exception):
            deliver_webhook(delivery.id)

        delivery.refresh_from_db()
        assert delivery.attempts == 1
        assert delivery.status == "pending"

        # Subsequent failing attempts up to MAX_RETRIES mark it failed
        delivery.attempts = 3
        delivery.save(update_fields=["attempts"])
        monkeypatch.setattr("celery.Task.retry", lambda self, *a, **k: None)
        deliver_webhook(delivery.id)
        delivery.refresh_from_db()
        assert delivery.status == "failed"


class TestWebhookAPI:
    def test_endpoint_crud_and_test(self, hook_data, monkeypatch):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {hook_data['token']}")

        created = client.post(
            "/api/v1/webhooks/endpoints/",
            {"url": "https://shop.example/hook", "events": ["order.paid", "*"], "is_active": True},
            format="json",
        )
        assert created.status_code == status.HTTP_201_CREATED, created.data
        endpoint_id = created.data["id"]
        assert created.data["secret"].startswith("whsec_")

        # Unknown event type rejected
        bad = client.post(
            "/api/v1/webhooks/endpoints/",
            {"url": "https://shop.example/hook", "events": ["nonsense.event"]},
            format="json",
        )
        assert bad.status_code == status.HTTP_400_BAD_REQUEST

        # Rotate secret
        old_secret = created.data["secret"]
        rotated = client.post(f"/api/v1/webhooks/endpoints/{endpoint_id}/rotate-secret/")
        assert rotated.status_code == status.HTTP_200_OK
        assert rotated.data["secret"] != old_secret

        # Test-fire queues a delivery (mock the celery queue)
        monkeypatch.setattr(
            "apps.webhooks.tasks.deliver_webhook.delay", staticmethod(lambda delivery_id: None)
        )
        test = client.post(f"/api/v1/webhooks/endpoints/{endpoint_id}/test/")
        assert test.status_code == status.HTTP_200_OK
        assert test.data["queued"] == 1

        # Deliveries visible in the log
        deliveries = client.get("/api/v1/webhooks/deliveries/")
        assert deliveries.status_code == status.HTTP_200_OK
        assert len(deliveries.data["results"] or deliveries.data) >= 1
