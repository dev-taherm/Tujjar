from __future__ import annotations

import logging

from apps.webhooks.models import WebhookDelivery
from apps.webhooks.services import build_request, process_delivery_result
from celery import shared_task

logger = logging.getLogger(__name__)

RETRY_COUNTDOWN = 60


@shared_task(bind=True, max_retries=3)
def deliver_webhook(self, delivery_id: str):
    """POST a signed webhook delivery with retries."""
    import requests

    delivery = WebhookDelivery.unscoped.filter(id=delivery_id).first()
    if not delivery or delivery.status == WebhookDelivery.Status.SUCCEEDED:
        return

    body, headers = build_request(delivery)
    response_status = None
    error = ""

    try:
        response = requests.post(
            delivery.endpoint.url,
            data=body,
            headers=headers,
            timeout=10,
        )
        response_status = response.status_code
        if not (200 <= response.status_code < 300):
            error = f"HTTP {response.status_code}"
    except requests.RequestException as exc:
        error = str(exc)

    new_status = process_delivery_result(delivery, response_status, error)

    if new_status == WebhookDelivery.Status.PENDING:
        logger.info(
            "Webhook delivery %s attempt %d failed (%s) — retrying",
            delivery_id,
            delivery.attempts,
            error,
        )
        try:
            raise self.retry(countdown=RETRY_COUNTDOWN * delivery.attempts)
        except self.MaxRetriesExceededError:
            delivery.status = WebhookDelivery.Status.FAILED
            delivery.save(update_fields=["status", "updated_at"])

    if new_status == WebhookDelivery.Status.FAILED:
        logger.warning("Webhook delivery %s permanently failed", delivery_id)
