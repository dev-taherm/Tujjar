from __future__ import annotations

import logging

from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.orders.models import Order
from apps.payments.services import (
    construct_webhook_event,
    create_stripe_checkout,
    handle_stripe_event,
    stripe_available,
)
from apps.stores.models import Store

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([AllowAny])
def checkout_config(request, subdomain=None):
    """Public checkout payment configuration for a store."""
    store = Store.objects.filter(slug=subdomain, is_active=True).first()
    if not store:
        return Response({"error": "Store not found"}, status=404)
    return Response(
        {
            "cod": True,
            "bank_transfer": True,
            "card": stripe_available(),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Stripe webhook endpoint — signature verified, never trust the body."""
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    try:
        event = construct_webhook_event(payload, sig_header)
    except Exception as exc:
        logger.warning("Stripe webhook rejected: %s", exc)
        return HttpResponse(status=400)

    result = handle_stripe_event(event)
    logger.info("Stripe webhook %s -> %s", event.get("type"), result)
    return HttpResponse(status=200)


@api_view(["POST"])
@permission_classes([AllowAny])
def create_card_payment(request, subdomain=None):
    """Create a Stripe Checkout Session for an existing unpaid order.

    Body: { order_id, success_url, cancel_url }
    Returns: { payment_url, payment_id }
    """
    store = Store.objects.filter(slug=subdomain, is_active=True).first()
    if not store:
        return Response({"error": "Store not found"}, status=404)

    if not stripe_available():
        return Response({"error": "Card payments are not configured for this store."}, status=400)

    body = request.data or {}
    order_id = body.get("order_id")
    order = (
        Order.unscoped.filter(id=order_id, store=store, payment_status="pending")
        .select_related("store")
        .first()
    )
    if not order:
        return Response({"error": "Unpaid order not found."}, status=404)

    success_url = body.get("success_url") or ""
    cancel_url = body.get("cancel_url") or ""
    if not success_url or not cancel_url:
        return Response({"error": "success_url and cancel_url are required."}, status=400)

    try:
        payment_url, payment = create_stripe_checkout(
            order,
            success_url=success_url,
            cancel_url=cancel_url,
        )
    except Exception:
        logger.exception("Stripe checkout creation failed for order %s", order.id)
        return Response({"error": "Payment provider error."}, status=502)

    return Response(
        {
            "payment_url": payment_url,
            "payment_id": str(payment.id),
            "provider": payment.provider,
        }
    )
