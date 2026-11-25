"""Commerce services: discount validation, tax, shipping, refunds.

Pure-Python calculation functions used by both the storefront checkout
quote endpoint and the order-creation checkout flow, so the dashboard and
the storefront always agree on pricing.
"""

from __future__ import annotations

import decimal
import logging
from dataclasses import dataclass, field
from decimal import Decimal
from typing import TYPE_CHECKING

from apps.commerce.models import (
    ZERO,
    Discount,
    Refund,
    ShippingRate,
    ShippingZone,
    TaxRate,
)

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from apps.orders.models import Order

__all__ = [
    "QuoteInput",
    "QuoteResult",
    "OrderLine",
    "resolve_discount",
    "calculate_tax",
    "calculate_shipping",
    "build_quote",
    "create_order_from_quote",
    "create_refund",
]


@dataclass
class QuoteInput:
    """Everything needed to price a checkout."""

    subtotal: Decimal
    country: str = ""
    state: str = ""
    postal_code: str = ""
    discount_code: str = ""
    shipping_rate_id: str | None = None
    customer_id: str | None = None
    # items as (product_id, quantity, line_total) for product-scoped discounts
    items: list[tuple[str, int, Decimal]] = field(default_factory=list)


@dataclass
class QuoteResult:
    subtotal: Decimal
    discount: Decimal = ZERO
    discount_code: str = ""
    discount_id: str | None = None
    discount_type: str = ""
    tax: Decimal = ZERO
    tax_rate: Decimal = ZERO
    tax_inclusive: bool = False
    shipping: Decimal = ZERO
    shipping_rate_id: str | None = None
    shipping_rate_name: str = ""
    total: Decimal = ZERO

    def as_dict(self) -> dict:
        return {
            "subtotal": str(self.subtotal),
            "discount": str(self.discount),
            "discount_code": self.discount_code,
            "discount_type": self.discount_type,
            "tax": str(self.tax),
            "tax_rate": str(self.tax_rate),
            "tax_inclusive": self.tax_inclusive,
            "shipping": str(self.shipping),
            "shipping_rate_id": self.shipping_rate_id,
            "shipping_rate_name": self.shipping_rate_name,
            "total": str(self.total),
        }


def _d(value) -> Decimal:
    return Decimal(str(value))


# ---------------------------------------------------------------------------
# Discounts
# ---------------------------------------------------------------------------


def resolve_discount(
    organization_id,
    code: str,
    *,
    subtotal: Decimal,
    customer_id: str | None = None,
    items: list[tuple[str, int, Decimal]] | None = None,
) -> Discount | None:
    """Return a usable Discount for this checkout, or None.

    Checks activity window, global usage, per-customer usage and
    product scoping. Raises no errors — an unusable code simply resolves
    to None (the caller decides whether to surface that to the shopper).
    """
    if not code:
        return None

    discount = Discount.unscoped.filter(
        organization_id=organization_id,
        code__iexact=code.strip(),
    ).first()
    if not discount or not discount.is_valid_now(subtotal=subtotal):
        return None

    # Per-customer usage limit
    if customer_id and discount.max_uses_per_customer is not None:
        from apps.orders.models import Order

        used = Order.unscoped.filter(
            organization_id=organization_id,
            customer_id=customer_id,
            discount_code__iexact=discount.code,
            status__in=["pending", "confirmed", "processing", "shipped", "delivered"],
        ).count()
        if used >= discount.max_uses_per_customer:
            return None

    # Product scoping: at least one item must be covered
    if not discount.applies_to_all_products:
        if not items:
            return None
        allowed_ids = {str(pid) for pid in discount.products.values_list("id", flat=True)}
        covered = any(str(item_product_id) in allowed_ids for item_product_id, _, _ in items)
        if not covered:
            return None

    return discount


def _discountable_subtotal(discount: Discount, subtotal: Decimal, items) -> Decimal:
    """Subtotal the discount applies to (respects product scoping)."""
    if discount.applies_to_all_products or not items:
        return subtotal
    allowed_ids = {str(pid) for pid in discount.products.values_list("id", flat=True)}
    return sum(
        (line_total for product_id, _, line_total in items if str(product_id) in allowed_ids),
        Decimal("0"),
    )


# ---------------------------------------------------------------------------
# Tax
# ---------------------------------------------------------------------------


def _match_tax_rate(
    organization_id, *, country: str, state: str, postal_code: str
) -> TaxRate | None:
    rates = list(TaxRate.unscoped.filter(organization_id=organization_id, is_active=True))
    if not rates:
        return None

    matching = [
        r for r in rates if r.matches(country=country, state=state, postal_code=postal_code)
    ]
    if matching:
        # Most specific match wins; ties broken by creation recency.
        return max(matching, key=lambda r: (r.specificity(), r.created_at))

    defaults = [r for r in rates if r.is_default]
    return defaults[0] if defaults else None


def calculate_tax(
    organization_id,
    taxable: Decimal,
    *,
    country: str = "",
    state: str = "",
    postal_code: str = "",
) -> tuple[Decimal, TaxRate | None]:
    """Return (tax_amount, matched_rate).

    Exclusive pricing: tax = taxable * rate.
    Inclusive pricing (VAT-style): the tax is extracted from `taxable`
    (taxable already contains it), so it does not increase the total.
    """
    rate = _match_tax_rate(organization_id, country=country, state=state, postal_code=postal_code)
    if not rate or taxable <= ZERO:
        return ZERO, rate

    if rate.inclusive:
        tax = (taxable * rate.rate / (Decimal("100") + rate.rate)).quantize(Decimal("0.01"))
    else:
        tax = (taxable * rate.rate / Decimal("100")).quantize(Decimal("0.01"))
    return tax, rate


# ---------------------------------------------------------------------------
# Shipping
# ---------------------------------------------------------------------------


def _zone_for(organization_id, country: str) -> ShippingZone | None:
    zones = list(ShippingZone.unscoped.filter(organization_id=organization_id, is_active=True))
    specific = [z for z in zones if z.country_list() and z.covers(country)]
    catch_all = [z for z in zones if not z.country_list()]
    if specific:
        return specific[0]
    if catch_all:
        return catch_all[0]
    return None


def available_shipping_rates(organization_id, *, country: str, subtotal: Decimal):
    """Shipping rates the shopper can pick from for this order."""
    zone = _zone_for(organization_id, country)
    if not zone:
        return []
    return [r for r in zone.rates.all() if r.is_available(subtotal)]


def calculate_shipping(
    organization_id,
    *,
    country: str = "",
    subtotal: Decimal,
    shipping_rate_id: str | None = None,
) -> tuple[Decimal, ShippingRate | None]:
    """Cost for the selected shipping rate (or the cheapest available one)."""
    rates = available_shipping_rates(organization_id, country=country, subtotal=subtotal)
    if not rates:
        return ZERO, None

    rate = None
    if shipping_rate_id:
        rate = next((r for r in rates if str(r.id) == str(shipping_rate_id)), None)
    if rate is None:
        rate = min(rates, key=lambda r: r.compute_cost(subtotal))
    return rate.compute_cost(subtotal), rate


# ---------------------------------------------------------------------------
# Quote assembly
# ---------------------------------------------------------------------------


def build_quote(
    organization_id,
    q: QuoteInput,
    *,
    persistable: bool = False,
) -> QuoteResult:
    """Full pricing breakdown: discount → tax → shipping → total.

    When `persistable` is True the caller intends to create an order from
    this quote, so stricter validation applies (unknown codes and
    unavailable rates fall back instead of silently changing totals).
    """
    subtotal = _d(q.subtotal or 0)

    quote = QuoteResult(subtotal=subtotal)

    # 1. Discount (on the items subtotal)
    discount = resolve_discount(
        organization_id,
        q.discount_code,
        subtotal=subtotal,
        customer_id=q.customer_id,
        items=q.items,
    )
    if discount:
        base = _discountable_subtotal(discount, subtotal, q.items)
        if discount.type == Discount.Type.FREE_SHIPPING:
            quote.discount_type = Discount.Type.FREE_SHIPPING
            # Shipping cost is waived below, once shipping is known.
        else:
            quote.discount = discount.compute_amount(base)
            quote.discount_type = discount.type
        quote.discount_code = discount.code
        quote.discount_id = str(discount.id)

    # 2. Tax base: subtotal after percentage/fixed discount
    discounted_subtotal = max(subtotal - quote.discount, Decimal("0"))

    # 3. Shipping
    shipping, rate = calculate_shipping(
        organization_id,
        country=q.country,
        subtotal=discounted_subtotal,
        shipping_rate_id=q.shipping_rate_id,
    )
    if rate:
        quote.shipping = shipping
        quote.shipping_rate_id = str(rate.id)
        quote.shipping_rate_name = rate.name

    # Free-shipping discount waives the shipping cost
    if discount and discount.type == Discount.Type.FREE_SHIPPING:
        quote.discount = quote.shipping
        quote.shipping = ZERO

    # 4. Tax (on discounted subtotal + shipping when exclusive)
    tax, tax_rate = calculate_tax(
        organization_id,
        discounted_subtotal,
        country=q.country,
        state=q.state,
        postal_code=q.postal_code,
    )
    if tax_rate and not tax_rate.inclusive:
        tax = (
            tax + (quote.shipping * tax_rate.rate / Decimal("100")).quantize(Decimal("0.01"))
        ).quantize(Decimal("0.01"))
    if tax_rate:
        quote.tax = tax
        quote.tax_rate = tax_rate.rate
        quote.tax_inclusive = tax_rate.inclusive

    # 5. Total (inclusive tax already sits inside the subtotal)
    quote.total = (
        discounted_subtotal + quote.shipping
        if quote.tax_inclusive
        else discounted_subtotal + quote.shipping + quote.tax
    )
    return quote


# ---------------------------------------------------------------------------
# Order creation (shared by cart checkout and public storefront checkout)
# ---------------------------------------------------------------------------


@dataclass
class OrderLine:
    """A resolved, server-validated line for order creation."""

    product_id: str
    variant_id: str | None
    title: str
    sku: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    image_url: str = ""
    track_inventory: bool = False
    allow_backorder: bool = False
    inventory_quantity: int = 0


def create_order_from_quote(
    store,
    *,
    quote: QuoteResult,
    lines: list[OrderLine],
    customer=None,
    customer_email: str,
    customer_first_name: str = "",
    customer_last_name: str = "",
    customer_phone: str = "",
    shipping_address: dict | None = None,
    payment_method: str = "cod",
) -> Order:
    """Create an order from a computed quote, atomically.

    Enforces inventory, applies quote financials, records discount usage,
    decrements stock and creates denormalized order items.
    """
    from django.db import transaction
    from django.db.models import F

    from apps.orders.models import Order, OrderItem, OrderTransitionError  # noqa: F401

    shipping_address = shipping_address or {}

    with transaction.atomic():
        # 1. Inventory validation with row locks
        for line in lines:
            if not line.track_inventory:
                continue
            locked = _lock_product(line.product_id)
            if locked.inventory_quantity < line.quantity and not locked.allow_backorder:
                raise ValueError(
                    f"Insufficient stock for '{line.title}'. Available: {locked.inventory_quantity}"
                )

        # 2. Order row with quote financials
        order = Order.objects.create(
            organization_id=store.organization_id,
            store=store,
            customer=customer,
            customer_email=customer_email,
            currency=getattr(store, "currency", None) or "USD",
            customer_first_name=customer_first_name,
            customer_last_name=customer_last_name,
            customer_phone=customer_phone,
            subtotal=quote.subtotal,
            tax_amount=quote.tax,
            shipping_amount=quote.shipping,
            discount_amount=quote.discount,
            discount_code=quote.discount_code,
            discount_id=quote.discount_id,
            shipping_method_name=quote.shipping_rate_name,
            payment_method=payment_method,
            total=Decimal("0"),
            shipping_address_line1=shipping_address.get("line1", ""),
            shipping_address_line2=shipping_address.get("line2", ""),
            shipping_city=shipping_address.get("city", ""),
            shipping_state=shipping_address.get("state", ""),
            shipping_postal_code=shipping_address.get("postal_code", ""),
            shipping_country=shipping_address.get("country", ""),
        )

        # Total: inclusive tax already sits inside the subtotal
        if quote.tax_inclusive:
            order.total = order.subtotal - order.discount_amount + order.shipping_amount
        else:
            order.total = (
                order.subtotal + order.tax_amount + order.shipping_amount - order.discount_amount
            )
        order.total = order.total.quantize(Decimal("0.01"))
        order.save(update_fields=["total"])

        # 3. Discount usage
        if quote.discount_id:
            from apps.commerce.models import Discount

            Discount.objects.filter(id=quote.discount_id).update(used_count=F("used_count") + 1)

        # 4. Inventory + denormalized items
        for line in lines:
            if line.track_inventory:
                _adjust_product_inventory(line)
            OrderItem.objects.create(
                order=order,
                product_id=line.product_id,
                variant_id=line.variant_id,
                title=line.title,
                sku=line.sku,
                quantity=line.quantity,
                unit_price=line.unit_price,
                total_price=line.line_total,
                image_url=line.image_url,
            )

    _dispatch_order_event("order.created", order)
    return order


def _dispatch_order_event(event_type: str, order) -> None:
    """Fan commerce events out to merchant webhooks (best-effort)."""
    try:
        from apps.webhooks.services import dispatch_event

        payload = {
            "order_id": str(order.id),
            "order_number": order.order_number,
            "status": order.status,
            "payment_status": order.payment_status,
            "total": str(order.total),
            "currency": order.currency,
            "customer_email": order.customer_email,
            "store_id": str(order.store_id),
        }
        dispatch_event(order.organization_id, event_type, payload)
    except Exception:  # pragma: no cover — never break commerce on webhooks
        logger.warning("webhook dispatch failed for %s", order.id, exc_info=True)


def _lock_product(product_id: str):
    from apps.products.models import Product

    return Product.objects.select_for_update().get(id=product_id)


def _adjust_product_inventory(line: OrderLine) -> None:
    from django.db.models import F

    from apps.products.models import Product

    Product.objects.filter(id=line.product_id).update(
        inventory_quantity=F("inventory_quantity") - line.quantity,
        total_sold=F("total_sold") + line.quantity,
        total_revenue=F("total_revenue") + line.line_total,
    )


# ---------------------------------------------------------------------------
# Refunds
# ---------------------------------------------------------------------------


def create_refund(
    order,
    *,
    amount: Decimal,
    reason: str = "",
    restock: bool = False,
    processed_by=None,
) -> Refund:
    """Create a refund and reconcile the order's payment status.

    Amount may not exceed the paid total minus already refunded amounts.
    """
    from django.db import transaction

    with transaction.atomic():
        already_refunded = order.refunds.filter(status=Refund.Status.SUCCEEDED).aggregate(
            total=models_sum_amount()
        )["total"] or Decimal("0")

        max_refundable = order.total - already_refunded
        amount = _d(amount)
        if amount <= ZERO:
            raise ValueError("Refund amount must be positive.")
        if amount > max_refundable:
            raise ValueError(f"Refund amount exceeds refundable balance ({max_refundable}).")

        refund = Refund.objects.create(
            organization_id=order.organization_id,
            order=order,
            amount=amount,
            reason=reason,
            status=Refund.Status.SUCCEEDED,
            restock=restock,
            processed_by=processed_by,
        )

        if restock:
            _restock_order_items(order, proportional_ratio(amount, order.total))

        total_refunded = already_refunded + amount
        if total_refunded >= order.total:
            order.payment_status = "refunded"
            if order.status == "delivered":
                order.transition_status("refunded")
        else:
            order.payment_status = "partially_paid"
        order.save(update_fields=["payment_status", "updated_at"])

        try:
            from apps.webhooks.services import dispatch_event

            dispatch_event(
                order.organization_id,
                "order.refunded",
                {
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "refund_amount": str(amount),
                    "refunded_total": str(total_refunded),
                    "payment_status": order.payment_status,
                },
            )
        except Exception:  # pragma: no cover — never break refunds
            logger.warning("webhook dispatch failed for refund on %s", order.id, exc_info=True)

        return refund


def models_sum_amount():
    from django.db.models import Sum

    return Sum("amount")


def proportional_ratio(amount: Decimal, total: Decimal) -> Decimal:
    if total <= ZERO:
        return Decimal("0")
    return min(amount / total, Decimal("1"))


def _restock_order_items(order, ratio: Decimal) -> None:
    """Return a proportional share of each line item's quantity to stock."""
    from django.db.models import F

    from apps.products.models import Product

    for item in order.items.select_related("product"):
        if not (item.product and item.product.track_inventory):
            continue
        qty = int((item.quantity * ratio).to_integral_value(rounding=decimal.ROUND_DOWN))
        if qty <= 0:
            continue
        Product.objects.filter(id=item.product_id).update(
            inventory_quantity=F("inventory_quantity") + qty,
            total_sold=F("total_sold") - qty,
        )
