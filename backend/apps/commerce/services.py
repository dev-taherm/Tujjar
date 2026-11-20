"""Commerce services: discount validation, tax, shipping, refunds.

Pure-Python calculation functions used by both the storefront checkout
quote endpoint and the order-creation checkout flow, so the dashboard and
the storefront always agree on pricing.
"""

from __future__ import annotations

import decimal
from dataclasses import dataclass, field
from decimal import Decimal

from apps.commerce.models import (
    ZERO,
    Discount,
    Refund,
    ShippingRate,
    ShippingZone,
    TaxRate,
)

__all__ = [
    "QuoteInput",
    "QuoteResult",
    "resolve_discount",
    "calculate_tax",
    "calculate_shipping",
    "build_quote",
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

    discount = (
        Discount.unscoped.filter(
            organization_id=organization_id,
            code__iexact=code.strip(),
        ).first()
    )
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


def _match_tax_rate(organization_id, *, country: str, state: str, postal_code: str) -> TaxRate | None:
    rates = list(
        TaxRate.unscoped.filter(organization_id=organization_id, is_active=True)
    )
    if not rates:
        return None

    matching = [r for r in rates if r.matches(country=country, state=state, postal_code=postal_code)]
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
    rate = _match_tax_rate(
        organization_id, country=country, state=state, postal_code=postal_code
    )
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
    zones = list(
        ShippingZone.unscoped.filter(organization_id=organization_id, is_active=True)
    )
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
        tax = (tax + (quote.shipping * tax_rate.rate / Decimal("100")).quantize(Decimal("0.01"))).quantize(
            Decimal("0.01")
        )
    if tax_rate:
        quote.tax = tax
        quote.tax_rate = tax_rate.rate
        quote.tax_inclusive = tax_rate.inclusive

    # 5. Total (inclusive tax already sits inside the subtotal)
    quote.total = (discounted_subtotal + quote.shipping if quote.tax_inclusive
                   else discounted_subtotal + quote.shipping + quote.tax)
    return quote


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
        already_refunded = order.refunds.filter(
            status=Refund.Status.SUCCEEDED
        ).aggregate(total=models_sum_amount())["total"] or Decimal("0")

        max_refundable = order.total - already_refunded
        amount = _d(amount)
        if amount <= ZERO:
            raise ValueError("Refund amount must be positive.")
        if amount > max_refundable:
            raise ValueError(
                f"Refund amount exceeds refundable balance ({max_refundable})."
            )

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
