"""Payment services: Stripe checkout sessions and webhook processing.

Stripe is optional — when STRIPE_SECRET_KEY is not configured the storefront
falls back to COD / bank transfer only.
"""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

from django.conf import settings

from apps.orders.models import Order
from apps.payments.models import Payment

logger = logging.getLogger(__name__)

__all__ = [
    "stripe_available",
    "create_stripe_checkout",
    "mark_order_paid",
    "handle_stripe_event",
]


def stripe_available() -> bool:
    return bool(settings.STRIPE_SECRET_KEY)


def _stripe():
    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_stripe_checkout(
    order: Order,
    *,
    success_url: str,
    cancel_url: str,
) -> tuple[str, Payment]:
    """Create a Stripe Checkout Session for an order.

    Returns (checkout_url, Payment record). The Payment starts PENDING and
    is confirmed by the webhook when the session completes.
    """
    stripe = _stripe()

    line_items = [
        {
            "price_data": {
                "currency": order.currency.lower(),
                "unit_amount": int((item.unit_price * 100).quantize(Decimal("1"))),
                "product_data": {"name": item.title},
            },
            "quantity": item.quantity,
        }
        for item in order.items.all()
    ]
    # Shipping / tax / discount adjustments as a single summary line so the
    # Stripe total matches the order total exactly.
    adjustment = order.total - order.subtotal
    if adjustment != 0:
        line_items.append(
            {
                "price_data": {
                    "currency": order.currency.lower(),
                    "unit_amount": int((adjustment * 100).quantize(Decimal("1"))),
                    "product_data": {"name": "Tax & shipping adjustments"},
                },
                "quantity": 1,
            }
        )

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=order.customer_email,
        client_reference_id=str(order.id),
        metadata={"order_id": str(order.id), "order_number": order.order_number},
        payment_method_types=["card"],
    )

    payment = Payment.objects.create(
        organization_id=order.organization_id,
        order=order,
        provider=Payment.Provider.STRIPE,
        provider_ref=session.id,
        amount=order.total,
        currency=order.currency,
        status=Payment.Status.PENDING,
    )
    return session.url, payment


def mark_order_paid(
    order: Order,
    *,
    provider: str,
    provider_ref: str = "",
    event_payload: dict[str, Any] | None = None,
) -> Payment:
    """Mark an order paid (idempotent) and record the payment."""
    payment, _created = Payment.objects.get_or_create(
        order=order,
        provider=provider,
        provider_ref=provider_ref,
        defaults={
            "organization_id": order.organization_id,
            "amount": order.total,
            "currency": order.currency,
            "status": Payment.Status.SUCCEEDED,
            "event_payload": event_payload or {},
        },
    )
    if payment.status != Payment.Status.SUCCEEDED:
        payment.status = Payment.Status.SUCCEEDED
        payment.event_payload = event_payload or {}
        payment.save(update_fields=["status", "event_payload", "updated_at"])

    if order.payment_status not in ("paid", "refunded"):
        order.payment_status = "paid"
        order.save(update_fields=["payment_status", "updated_at"])

        # Move pending orders forward
        if order.status == "pending":
            try:
                order.transition_status("confirmed")
            except Exception:
                logger.warning(
                    "Could not auto-confirm order %s after payment", order.id, exc_info=True
                )

    _dispatch_webhook(order, "order.paid")
    return payment


def _dispatch_webhook(order, event_type: str) -> None:
    """Best-effort webhook fan-out (never breaks payment flows)."""
    try:
        from apps.commerce.services import _dispatch_order_event

        _dispatch_order_event(event_type, order)
    except Exception:
        logger.warning("webhook dispatch failed for %s", order.id, exc_info=True)


def handle_stripe_event(event: dict[str, Any]) -> dict[str, Any]:
    """Process a verified Stripe event and return a status summary."""
    event_type = event.get("type", "")
    obj = event.get("data", {}).get("object", {})

    if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        order_id = obj.get("metadata", {}).get("order_id") or obj.get("client_reference_id")
        if not order_id:
            return {"handled": False, "reason": "no order reference"}
        order = Order.unscoped.filter(id=order_id).first()
        if not order:
            return {"handled": False, "reason": "order not found"}
        mark_order_paid(
            order,
            provider=Payment.Provider.STRIPE,
            provider_ref=obj.get("id", ""),
            event_payload=obj,
        )
        return {"handled": True, "order": str(order.id), "payment_status": "paid"}

    if event_type in ("checkout.session.expired", "checkout.session.async_payment_failed"):
        order_id = obj.get("metadata", {}).get("order_id")
        payment = Payment.objects.filter(provider_ref=obj.get("id", "")).first()
        if payment and payment.status == Payment.Status.PENDING:
            payment.status = Payment.Status.FAILED
            payment.event_payload = obj
            payment.save(update_fields=["status", "event_payload", "updated_at"])
        if order_id:
            logger.info("Stripe session %s for order %s failed/expired", obj.get("id"), order_id)
        return {"handled": True, "payment_status": "failed"}

    return {"handled": False, "event_type": event_type}


def construct_webhook_event(payload: bytes, signature: str) -> dict[str, Any]:
    """Verify a Stripe webhook signature and return the event dict."""
    stripe = _stripe()
    secret = settings.STRIPE_WEBHOOK_SECRET
    if not secret:
        raise ValueError("STRIPE_WEBHOOK_SECRET is not configured")
    return stripe.Webhook.construct_event(payload, signature, secret)
