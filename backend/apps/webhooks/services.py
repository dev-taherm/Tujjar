"""Webhook event dispatch and delivery.

Events are signed with HMAC-SHA256 using the endpoint's secret and sent
with informative headers. Delivery happens through Celery with exponential
backoff retries; dispatch_event never raises into the caller's flow.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
from typing import Any

from apps.webhooks.models import WebhookDelivery, WebhookEndpoint

logger = logging.getLogger(__name__)

EVENT_TYPES = [
    "order.created",
    "order.paid",
    "order.status_changed",
    "order.refunded",
    "product.created",
    "product.updated",
    "review.created",
]

SIGNATURE_HEADER = "X-Tujjar-Signature"
EVENT_HEADER = "X-Tujjar-Event"
DELIVERY_HEADER = "X-Tujjar-Delivery"

MAX_RETRIES = 3


def compute_signature(secret: str, body: bytes) -> str:
    """Hex HMAC-SHA256 of the raw body with the endpoint secret."""
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def dispatch_event(org_id, event_type: str, payload: dict[str, Any]) -> int:
    """Fan an event out to every subscribed endpoint of the organization.

    Creates a PENDING delivery per endpoint and queues the Celery task.
    Never raises — webhook failures must not break commerce flows.
    Returns the number of endpoints queued.
    """
    try:
        endpoints = [
            e
            for e in WebhookEndpoint.unscoped.filter(
                organization_id=org_id, is_active=True
            )
            if e.subscribes_to(event_type)
        ]
        if not endpoints:
            return 0

        from apps.webhooks.tasks import deliver_webhook

        queued = 0
        for endpoint in endpoints:
            delivery = WebhookDelivery.objects.create(
                organization_id=org_id,
                endpoint=endpoint,
                event_type=event_type,
                payload=payload,
            )
            try:
                deliver_webhook.delay(str(delivery.id))
                queued += 1
            except Exception:
                logger.warning(
                    "Could not queue webhook delivery %s", delivery.id, exc_info=True
                )
        return queued
    except Exception:  # pragma: no cover — dispatch is best-effort
        logger.exception("dispatch_event(%s) failed", event_type)
        return 0


def build_request(delivery: WebhookDelivery) -> tuple[bytes, dict[str, str]]:
    """Serialize the delivery into (body, headers) with the signature."""
    body = json.dumps(
        {
            "id": str(delivery.id),
            "type": delivery.event_type,
            "created_at": delivery.created_at.isoformat(),
            "data": delivery.payload,
        },
        separators=(",", ":"),
    ).encode()

    headers = {
        "Content-Type": "application/json",
        EVENT_HEADER: delivery.event_type,
        DELIVERY_HEADER: str(delivery.id),
        SIGNATURE_HEADER: f"sha256={compute_signature(delivery.endpoint.secret, body)}",
    }
    return body, headers


def process_delivery_result(delivery: WebhookDelivery, response_status: int | None, error: str) -> str:
    """Record one delivery attempt and decide the follow-up status."""
    delivery.attempts += 1
    delivery.response_status = response_status
    delivery.error = (error or "")[:500]

    succeeded = error == "" and response_status is not None and 200 <= response_status < 300
    if succeeded:
        delivery.status = WebhookDelivery.Status.SUCCEEDED
    elif delivery.attempts >= MAX_RETRIES:
        delivery.status = WebhookDelivery.Status.FAILED
    else:
        delivery.status = WebhookDelivery.Status.PENDING
    delivery.save()
    return delivery.status
