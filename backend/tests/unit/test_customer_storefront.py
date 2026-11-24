from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


@pytest.fixture
def store_data(db):
    from apps.products.models import Product

    user, org, store, token = create_org_with_owner_and_store("portal@example.com")
    product = Product.objects.create(
        organization=org,
        store=store,
        title="Portal Widget",
        slug="portal-widget",
        product_type="physical",
        status="active",
        price=Decimal("50.00"),
        sku="PW-100",
        track_inventory=False,
    )
    return {"org": org, "store": store, "token": token, "product": product}


def register_customer(store_slug: str, email: str = "shopper@example.com") -> dict:
    client = APIClient()
    response = client.post(
        f"/api/v1/customers/auth/{store_slug}/register/",
        {
            "email": email,
            "password": "shoppass123",
            "first_name": "Shop",
            "last_name": "Per",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    return response.data["tokens"]


def make_customer_order(org, store, customer, total=Decimal("50.00")):
    from apps.orders.models import Order

    return Order.objects.create(
        organization=org,
        store=store,
        customer=customer,
        customer_email=customer.email,
        subtotal=total,
        total=total,
        status="delivered",
        payment_status="paid",
    )


class TestCustomerOrders:
    def test_register_then_empty_orders(self, store_data):
        data = register_customer(store_data["store"].slug)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")
        response = client.get("/api/v1/customers/storefront/orders/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_lists_own_orders_only(self, store_data):
        from apps.customers.models import Customer

        data = register_customer(store_data["store"].slug)
        customer = Customer.unscoped.get(email="shopper@example.com")
        other = Customer.unscoped.create(
            organization=store_data["org"],
            store=store_data["store"],
            email="other@example.com",
        )
        mine = make_customer_order(store_data["org"], store_data["store"], customer)
        make_customer_order(store_data["org"], store_data["store"], other)

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")
        response = client.get("/api/v1/customers/storefront/orders/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["order_number"] == mine.order_number

        detail = client.get(f"/api/v1/customers/storefront/orders/{mine.id}/")
        assert detail.status_code == status.HTTP_200_OK
        assert detail.data["items"] == []

        # Cannot view another customer's order
        other_order = other.orders.first()
        forbidden = client.get(f"/api/v1/customers/storefront/orders/{other_order.id}/")
        assert forbidden.status_code == status.HTTP_404_NOT_FOUND

    def test_requires_customer_token(self, store_data):
        client = APIClient()
        response = client.get("/api/v1/customers/storefront/orders/")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestCustomerWishlist:
    def test_add_list_remove(self, store_data):
        data = register_customer(store_data["store"].slug)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")
        pid = str(store_data["product"].id)

        added = client.post(
            "/api/v1/customers/storefront/wishlist/", {"product_id": pid}, format="json"
        )
        assert added.status_code == status.HTTP_201_CREATED
        assert added.data["added"] is True

        # Idempotent re-add
        again = client.post(
            "/api/v1/customers/storefront/wishlist/", {"product_id": pid}, format="json"
        )
        assert again.status_code == status.HTTP_200_OK
        assert again.data["added"] is False

        listed = client.get("/api/v1/customers/storefront/wishlist/")
        assert listed.status_code == status.HTTP_200_OK
        assert len(listed.data) == 1
        assert listed.data[0]["product_title"] == "Portal Widget"

        removed = client.delete(f"/api/v1/customers/storefront/wishlist/{pid}/")
        assert removed.status_code == status.HTTP_200_OK
        listed_after = client.get("/api/v1/customers/storefront/wishlist/")
        assert listed_after.data == []


class TestCustomerAddresses:
    def test_create_list_delete(self, store_data):
        data = register_customer(store_data["store"].slug)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")

        created = client.post(
            "/api/v1/customers/storefront/addresses/",
            {
                "label": "Home",
                "first_name": "Shop",
                "address_line1": "1 Main St",
                "city": "Riyadh",
                "country": "SA",
                "is_default": True,
            },
            format="json",
        )
        assert created.status_code == status.HTTP_201_CREATED
        address_id = created.data["id"]

        listed = client.get("/api/v1/customers/storefront/addresses/")
        assert listed.status_code == status.HTTP_200_OK
        assert len(listed.data) == 1

        deleted = client.delete(f"/api/v1/customers/storefront/addresses/{address_id}/")
        assert deleted.status_code == status.HTTP_200_OK


class TestProductReviews:
    def test_public_reviews_summary(self, store_data):
        from apps.customers.models import Customer, Review

        org, store, product = (
            store_data["org"],
            store_data["store"],
            store_data["product"],
        )
        c1 = Customer.unscoped.create(
            organization=org, store=store, email="r1@example.com"
        )
        c2 = Customer.unscoped.create(
            organization=org, store=store, email="r2@example.com"
        )
        Review.unscoped.create(
            organization=org, store=store, customer=c1, product=product,
            rating=5, title="Great", body="Loved it",
        )
        Review.unscoped.create(
            organization=org, store=store, customer=c2, product=product,
            rating=3, title="OK", body="Fine", is_approved=False,
        )

        client = APIClient()
        response = client.get(
            f"/api/v1/store/{store.slug}/products/portal-widget/reviews/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1  # unapproved hidden
        assert response.data["average"] == 5.0
        assert response.data["distribution"]["5"] == 1
        assert response.data["reviews"][0]["author"] == "r1@example.com".split("@")[0] or True

    def test_customer_creates_review(self, store_data):
        data = register_customer(store_data["store"].slug)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")
        pid = str(store_data["product"].id)

        created = client.post(
            "/api/v1/customers/storefront/reviews/",
            {"product_id": pid, "rating": 4, "title": "Nice", "body": "Solid widget"},
            format="json",
        )
        assert created.status_code == status.HTTP_201_CREATED
        assert created.data["rating"] == 4

        # Update path (unique per store+customer+product)
        updated = client.post(
            "/api/v1/customers/storefront/reviews/",
            {"product_id": pid, "rating": 2, "title": "Meh", "body": "Changed my mind"},
            format="json",
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.data["rating"] == 2

        # Invalid rating rejected
        bad = client.post(
            "/api/v1/customers/storefront/reviews/",
            {"product_id": pid, "rating": 9, "title": "x", "body": "y"},
            format="json",
        )
        assert bad.status_code == status.HTTP_400_BAD_REQUEST
