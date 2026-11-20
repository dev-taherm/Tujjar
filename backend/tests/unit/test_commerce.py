from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db

NOW = timezone.now()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def pricing_data(db):
    """Org, store, product + a shipping zone/rate and a tax rate."""
    from apps.commerce.models import ShippingRate, ShippingZone, TaxRate
    from apps.products.models import Product

    user, org, store, token = create_org_with_owner_and_store("commerce@example.com")
    product = Product.objects.create(
        organization=org,
        store=store,
        title="Quote Product",
        slug="quote-product",
        product_type="physical",
        status="active",
        price=Decimal("100.00"),
        sku="QP-001",
        track_inventory=False,
    )
    zone = ShippingZone.objects.create(
        organization=org, name="Domestic", countries="US,CA", is_active=True
    )
    rate = ShippingRate.objects.create(
        zone=zone,
        name="Standard",
        pricing_type=ShippingRate.PricingType.FLAT,
        price=Decimal("10.00"),
        is_active=True,
    )
    tax = TaxRate.objects.create(
        organization=org,
        name="Sales Tax",
        rate=Decimal("10.00"),
        country="US",
        is_active=True,
    )
    return {
        "user": user,
        "org": org,
        "store": store,
        "token": token,
        "product": product,
        "zone": zone,
        "rate": rate,
        "tax": tax,
    }


def make_discount(org, **overrides):
    from apps.commerce.models import Discount

    defaults = {
        "organization": org,
        "code": "SAVE10",
        "type": Discount.Type.PERCENTAGE,
        "value": Decimal("10.00"),
        "is_active": True,
    }
    defaults.update(overrides)
    return Discount.objects.create(**defaults)


def make_order(org, store, subtotal=Decimal("100.00")):
    from apps.orders.models import Order

    return Order.objects.create(
        organization=org,
        store=store,
        customer_email="buyer@example.com",
        subtotal=subtotal,
        total=subtotal,
        payment_status="paid",
        status="delivered",
    )


# ---------------------------------------------------------------------------
# Discount model
# ---------------------------------------------------------------------------


class TestDiscountModel:
    def test_percentage_computation(self, pricing_data):
        discount = make_discount(pricing_data["org"])
        assert discount.compute_amount(Decimal("100.00")) == Decimal("10.00")

    def test_fixed_computation_capped_at_subtotal(self, pricing_data):
        discount = make_discount(
            pricing_data["org"],
            code="FLAT25",
            type="fixed",
            value=Decimal("25.00"),
        )
        assert discount.compute_amount(Decimal("20.00")) == Decimal("20.00")

    def test_free_shipping_does_not_touch_subtotal(self, pricing_data):
        discount = make_discount(
            pricing_data["org"], code="SHIPFREE", type="free_shipping"
        )
        assert discount.compute_amount(Decimal("100.00")) == Decimal("0")

    def test_validity_window(self, pricing_data):
        discount = make_discount(
            pricing_data["org"],
            code="EXPIRED",
            valid_until=NOW - timezone.timedelta(days=1),
        )
        assert not discount.is_valid_now(subtotal=Decimal("100.00"))

    def test_min_subtotal(self, pricing_data):
        discount = make_discount(
            pricing_data["org"], code="BIGSPEND", min_subtotal=Decimal("500.00")
        )
        assert not discount.is_valid_now(subtotal=Decimal("100.00"))
        assert discount.is_valid_now(subtotal=Decimal("600.00"))

    def test_usage_limit(self, pricing_data):
        discount = make_discount(
            pricing_data["org"], code="LIMITED", max_uses=1, used_count=1
        )
        assert not discount.is_valid_now(subtotal=Decimal("100.00"))


# ---------------------------------------------------------------------------
# Tax
# ---------------------------------------------------------------------------


class TestTaxRate:
    def test_specificity_priority(self, pricing_data):
        from apps.commerce.models import TaxRate

        org = pricing_data["org"]
        TaxRate.objects.create(
            organization=org, name="State", rate=Decimal("5"), country="US", state="CA"
        )
        TaxRate.objects.create(
            organization=org,
            name="Postal",
            rate=Decimal("7"),
            country="US",
            state="CA",
            postal_code="90001",
        )
        from apps.commerce.services import calculate_tax

        tax, rate = calculate_tax(
            org.id, Decimal("100"), country="US", state="CA", postal_code="90001"
        )
        assert rate.name == "Postal"
        assert tax == Decimal("7.00")

    def test_inclusive_extraction(self, pricing_data):
        from apps.commerce.models import TaxRate

        from apps.commerce.services import calculate_tax

        TaxRate.objects.create(
            organization=pricing_data["org"],
            name="VAT",
            rate=Decimal("20"),
            country="GB",
            inclusive=True,
            is_active=True,
        )
        tax, rate = calculate_tax(pricing_data["org"].id, Decimal("120"), country="GB")
        assert rate.inclusive
        # 120 with 20% VAT inclusive -> 20 of tax extracted
        assert tax == Decimal("20.00")

    def test_default_rate_used_when_no_match(self, pricing_data):
        from apps.commerce.services import calculate_tax

        pricing_data["tax"].is_default = True
        pricing_data["tax"].save(update_fields=["is_default"])
        tax, rate = calculate_tax(pricing_data["org"].id, Decimal("100"), country="DE")
        assert rate is not None
        assert rate.is_default
        assert tax == Decimal("10.00")


# ---------------------------------------------------------------------------
# Shipping
# ---------------------------------------------------------------------------


class TestShipping:
    def test_zone_country_matching(self, pricing_data):
        assert pricing_data["zone"].covers("US")
        assert pricing_data["zone"].covers("ca")
        assert not pricing_data["zone"].covers("GB")

    def test_rest_of_world_zone_catches_all(self, pricing_data):
        from apps.commerce.models import ShippingZone

        zone = ShippingZone.objects.create(
            organization=pricing_data["org"], name="ROW", countries=""
        )
        assert zone.covers("ZZ")

    def test_rate_availability_window(self, pricing_data):
        from apps.commerce.models import ShippingRate

        rate = ShippingRate.objects.create(
            zone=pricing_data["zone"],
            name="Express",
            price=Decimal("25"),
            min_order_subtotal=Decimal("50"),
            max_order_subtotal=Decimal("200"),
        )
        assert rate.is_available(Decimal("100"))
        assert not rate.is_available(Decimal("10"))
        assert not rate.is_available(Decimal("500"))

    def test_free_over(self, pricing_data):
        from apps.commerce.models import ShippingRate

        rate = ShippingRate.objects.create(
            zone=pricing_data["zone"],
            name="Free Over",
            price=Decimal("10"),
            free_over=Decimal("150"),
        )
        assert rate.compute_cost(Decimal("100")) == Decimal("10.00")
        assert rate.compute_cost(Decimal("150")) == Decimal("0")


# ---------------------------------------------------------------------------
# Quote assembly
# ---------------------------------------------------------------------------


class TestQuote:
    def test_full_quote_percentage_discount_exclusive_tax_shipping(self, pricing_data):
        from apps.commerce.services import QuoteInput, build_quote

        make_discount(pricing_data["org"])  # SAVE10, 10%
        quote = build_quote(
            pricing_data["org"].id,
            QuoteInput(
                subtotal=Decimal("100.00"),
                country="US",
                shipping_rate_id=str(pricing_data["rate"].id),
                discount_code="SAVE10",
            ),
        )
        assert quote.discount == Decimal("10.00")
        assert quote.tax == Decimal("9.00")  # 10% of 90 + shipping tax 1.00
        assert quote.shipping == Decimal("10.00")
        assert quote.total == Decimal("109.00")

    def test_invalid_code_is_ignored(self, pricing_data):
        from apps.commerce.services import QuoteInput, build_quote

        quote = build_quote(
            pricing_data["org"].id,
            QuoteInput(subtotal=Decimal("100.00"), country="US", discount_code="NOPE"),
        )
        assert quote.discount == Decimal("0")

    def test_free_shipping_discount_waives_shipping(self, pricing_data):
        from apps.commerce.services import QuoteInput, build_quote

        make_discount(
            pricing_data["org"], code="SHIPFREE", type="free_shipping"
        )
        quote = build_quote(
            pricing_data["org"].id,
            QuoteInput(
                subtotal=Decimal("100.00"),
                country="US",
                shipping_rate_id=str(pricing_data["rate"].id),
                discount_code="SHIPFREE",
            ),
        )
        assert quote.shipping == Decimal("0")
        assert quote.discount == Decimal("10.00")
        assert quote.total == Decimal("100.00")

    def test_no_zone_means_no_shipping(self, pricing_data):
        from apps.commerce.services import QuoteInput, build_quote

        quote = build_quote(
            pricing_data["org"].id, QuoteInput(subtotal=Decimal("100.00"), country="ZZ")
        )
        assert quote.shipping == Decimal("0")


# ---------------------------------------------------------------------------
# Refunds
# ---------------------------------------------------------------------------


class TestRefundService:
    def test_full_refund_reconciles_status(self, pricing_data):
        from apps.commerce.services import create_refund

        order = make_order(pricing_data["org"], pricing_data["store"])
        refund = create_refund(order, amount=Decimal("100.00"), reason="test")
        assert refund.status == "succeeded"
        order.refresh_from_db()
        assert order.payment_status == "refunded"
        assert order.status == "refunded"

    def test_partial_refund(self, pricing_data):
        from apps.commerce.services import create_refund

        order = make_order(pricing_data["org"], pricing_data["store"])
        create_refund(order, amount=Decimal("40.00"))
        order.refresh_from_db()
        assert order.payment_status == "partially_paid"
        assert order.status == "delivered"

    def test_over_refund_rejected(self, pricing_data):
        from apps.commerce.services import create_refund

        order = make_order(pricing_data["org"], pricing_data["store"])
        with pytest.raises(ValueError):
            create_refund(order, amount=Decimal("200.00"))

    def test_refund_twice_capped(self, pricing_data):
        from apps.commerce.services import create_refund

        order = make_order(pricing_data["org"], pricing_data["store"])
        create_refund(order, amount=Decimal("60.00"))
        with pytest.raises(ValueError):
            create_refund(order, amount=Decimal("60.00"))


# ---------------------------------------------------------------------------
# Dashboard API
# ---------------------------------------------------------------------------


class TestCommerceAPI:
    def test_discount_crud(self, pricing_data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {pricing_data['token']}")
        response = client.post(
            "/api/v1/commerce/discounts/",
            {
                "code": "API10",
                "type": "percentage",
                "value": "10",
                "is_active": True,
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        discount_id = response.data["id"]

        detail = client.get(f"/api/v1/commerce/discounts/{discount_id}/")
        assert detail.status_code == status.HTTP_200_OK
        assert detail.data["code"] == "API10"

    def test_percentage_over_100_rejected(self, pricing_data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {pricing_data['token']}")
        response = client.post(
            "/api/v1/commerce/discounts/",
            {"code": "TOOBIG", "type": "percentage", "value": "150"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_tax_rate_crud(self, pricing_data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {pricing_data['token']}")
        response = client.post(
            "/api/v1/commerce/taxes/",
            {"name": "VAT", "rate": "15", "country": "SA", "inclusive": True},
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_shipping_zone_with_rates(self, pricing_data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {pricing_data['token']}")
        zone = client.post(
            "/api/v1/commerce/shipping/zones/",
            {"name": "GCC", "countries": "SA,AE", "is_active": True},
        )
        assert zone.status_code == status.HTTP_201_CREATED
        rate = client.post(
            "/api/v1/commerce/shipping/rates/",
            {
                "zone": zone.data["id"],
                "name": "Courier",
                "pricing_type": "flat",
                "price": "15",
            },
        )
        assert rate.status_code == status.HTTP_201_CREATED

    def test_refund_endpoint(self, pricing_data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {pricing_data['token']}")
        order = make_order(pricing_data["org"], pricing_data["store"])
        response = client.post(
            "/api/v1/commerce/refunds/",
            {
                "order": str(order.id),
                "amount": "50.00",
                "reason": "Customer request",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        order.refresh_from_db()
        assert order.payment_status == "partially_paid"


# ---------------------------------------------------------------------------
# Storefront checkout quote (public)
# ---------------------------------------------------------------------------


class TestStorefrontQuote:
    def test_quote_for_guest_items(self, pricing_data):
        client = APIClient()
        response = client.post(
            f"/api/v1/store/{pricing_data['store'].slug}/checkout/quote/",
            {
                "items": [
                    {"product_id": str(pricing_data["product"].id), "quantity": 2}
                ],
                "shipping_country": "US",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["subtotal"] == "200.00"
        assert response.data["shipping"] == "10.00"
        assert response.data["tax"] == "20.00"
        assert response.data["total"] == "230.00"
        rate_ids = [r["id"] for r in response.data["shipping_rates"]]
        assert str(pricing_data["rate"].id) in rate_ids

    def test_quote_applies_discount(self, pricing_data):
        make_discount(pricing_data["org"], code="SAVE25", value=Decimal("25"))
        client = APIClient()
        response = client.post(
            f"/api/v1/store/{pricing_data['store'].slug}/checkout/quote/",
            {
                "items": [
                    {"product_id": str(pricing_data["product"].id), "quantity": 1}
                ],
                "discount_code": "SAVE25",
                "shipping_country": "US",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["discount"] == "25.00"

    def test_quote_rejects_cross_tenant_product(self, pricing_data):
        _, other_org, _, _ = create_org_with_owner_and_store("other@example.com")
        from apps.products.models import Product

        foreign = Product.objects.create(
            organization=other_org,
            store=other_org.stores.first(),
            title="Foreign",
            slug="foreign",
            product_type="physical",
            status="active",
            price=Decimal("10"),
            sku="FR-1",
        )
        client = APIClient()
        response = client.post(
            f"/api/v1/store/{pricing_data['store'].slug}/checkout/quote/",
            {"items": [{"product_id": str(foreign.id), "quantity": 1}]},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
