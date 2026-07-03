from __future__ import annotations

from decimal import Decimal

import pytest
from rest_framework import status
from tests.factories import create_org_with_owner_and_store

from apps.customers.models import (
    Address,
    Customer,
    LoyaltyTransaction,
    Review,
    SavedCart,
    SavedCartItem,
    WishlistItem,
)
from apps.products.models import Product

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_customer(org, store, **kwargs):
    defaults = {
        "organization": org,
        "store": store,
        "email": "cust@example.com",
        "first_name": "John",
        "last_name": "Doe",
    }
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


def _create_product(org, store, **kwargs):
    defaults = {
        "organization": org,
        "store": store,
        "title": "Test Product",
        "slug": "test-product",
        "status": "active",
        "price": Decimal("29.99"),
        "sku": "TP-001",
    }
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


# ===========================================================================
# Customer CRUD (existing)
# ===========================================================================


class TestCustomerCRUD:
    def test_list_customers(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        _create_customer(org, store, email="a@test.com")
        _create_customer(org, store, email="b@test.com")
        response = api_client.get("/api/v1/customers/customers/", format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pagination"]["total"] == 2

    def test_create_customer(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/customers/customers/",
            {
                "store": str(store.id),
                "email": "new@test.com",
                "first_name": "Jane",
                "last_name": "Smith",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "new@test.com"

    def test_retrieve_customer(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        response = api_client.get(f"/api/v1/customers/customers/{customer.id}/", format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == str(customer.id)

    def test_update_customer(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        response = api_client.patch(
            f"/api/v1/customers/customers/{customer.id}/",
            {"first_name": "Updated"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Updated"

    def test_delete_customer(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        response = api_client.delete(f"/api/v1/customers/customers/{customer.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Customer.objects.filter(id=customer.id).exists()

    def test_search_customer(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        _create_customer(org, store, email="alice@test.com", first_name="Alice")
        _create_customer(org, store, email="bob@test.com", first_name="Bob")
        response = api_client.get(
            "/api/v1/customers/customers/",
            {"search": "alice"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pagination"]["total"] == 1


# ===========================================================================
# Address
# ===========================================================================


class TestAddress:
    def test_create_address(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        response = api_client.post(
            "/api/v1/customers/addresses/",
            {
                "store": str(store.id),
                "customer": str(customer.id),
                "label": "Home",
                "first_name": "John",
                "last_name": "Doe",
                "address_line1": "123 Main St",
                "city": "New York",
                "state": "NY",
                "country": "US",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["label"] == "Home"
        assert response.data["is_default"] is False

    def test_list_addresses(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        Address.objects.create(
            organization=org,
            store=store,
            customer=customer,
            label="Home",
            address_line1="123 Main St",
            city="NY",
            country="US",
        )
        Address.objects.create(
            organization=org,
            store=store,
            customer=customer,
            label="Work",
            address_line1="456 Office",
            city="NY",
            country="US",
        )
        response = api_client.get(
            "/api/v1/customers/addresses/",
            {"customer": str(customer.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pagination"]["total"] == 2

    def test_update_address(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        addr = Address.objects.create(
            organization=org,
            store=store,
            customer=customer,
            label="Home",
            address_line1="123 Main St",
            city="NY",
            country="US",
        )
        response = api_client.patch(
            f"/api/v1/customers/addresses/{addr.id}/",
            {"label": "Apartment"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["label"] == "Apartment"

    def test_delete_address(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        addr = Address.objects.create(
            organization=org,
            store=store,
            customer=customer,
            label="Home",
            address_line1="123 Main St",
            city="NY",
            country="US",
        )
        response = api_client.delete(f"/api/v1/customers/addresses/{addr.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_set_default_address(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        addr1 = Address.objects.create(
            organization=org,
            store=store,
            customer=customer,
            label="Home",
            address_line1="123 Main St",
            city="NY",
            country="US",
            is_default=True,
        )
        addr2 = Address.objects.create(
            organization=org,
            store=store,
            customer=customer,
            label="Work",
            address_line1="456 Office",
            city="NY",
            country="US",
        )
        response = api_client.post(f"/api/v1/customers/addresses/{addr2.id}/set-default/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_default"] is True
        addr1.refresh_from_db()
        assert addr1.is_default is False

    def test_customer_sub_resource_addresses(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        Address.objects.create(
            organization=org,
            store=store,
            customer=customer,
            label="Home",
            address_line1="123 Main St",
            city="NY",
            country="US",
        )
        response = api_client.get(
            f"/api/v1/customers/customers/{customer.id}/addresses/",
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1


# ===========================================================================
# Wishlist
# ===========================================================================


class TestWishlist:
    def test_add_to_wishlist(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        response = api_client.post(
            "/api/v1/customers/wishlist/",
            {"store": str(store.id), "customer": str(customer.id), "product": str(product.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_wishlist(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        WishlistItem.objects.create(
            organization=org,
            store=store,
            customer=customer,
            product=product,
        )
        response = api_client.get(
            "/api/v1/customers/wishlist/",
            {"customer": str(customer.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pagination"]["total"] == 1

    def test_remove_from_wishlist(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        item = WishlistItem.objects.create(
            organization=org,
            store=store,
            customer=customer,
            product=product,
        )
        response = api_client.delete(f"/api/v1/customers/wishlist/{item.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not WishlistItem.objects.filter(id=item.id).exists()

    def test_duplicate_wishlist_prevented(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        WishlistItem.objects.create(
            organization=org,
            store=store,
            customer=customer,
            product=product,
        )
        response = api_client.post(
            "/api/v1/customers/wishlist/",
            {"store": str(store.id), "customer": str(customer.id), "product": str(product.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_customer_sub_resource_wishlist(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        WishlistItem.objects.create(
            organization=org,
            store=store,
            customer=customer,
            product=product,
        )
        response = api_client.get(
            f"/api/v1/customers/customers/{customer.id}/wishlist/",
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1


# ===========================================================================
# Review
# ===========================================================================


class TestReview:
    def test_create_review(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        response = api_client.post(
            "/api/v1/customers/reviews/",
            {
                "store": str(store.id),
                "customer": str(customer.id),
                "product": str(product.id),
                "rating": 5,
                "title": "Great product!",
                "body": "Loved it.",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["rating"] == 5
        assert response.data["is_approved"] is True

    def test_list_reviews(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        Review.objects.create(
            organization=org,
            store=store,
            customer=customer,
            product=product,
            rating=4,
            title="Good",
            body="Nice",
        )
        response = api_client.get(
            "/api/v1/customers/reviews/",
            {"customer": str(customer.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pagination"]["total"] == 1

    def test_approve_review(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        review = Review.objects.create(
            organization=org,
            store=store,
            customer=customer,
            product=product,
            rating=3,
            title="Ok",
            body="Meh",
            is_approved=False,
        )
        response = api_client.post(f"/api/v1/customers/reviews/{review.id}/approve/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_approved"] is True

    def test_reject_review(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        review = Review.objects.create(
            organization=org,
            store=store,
            customer=customer,
            product=product,
            rating=5,
            title="Best!",
            body="Amazing",
        )
        response = api_client.post(f"/api/v1/customers/reviews/{review.id}/reject/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_approved"] is False

    def test_product_reviews_public(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer1 = _create_customer(org, store, email="c1@test.com")
        customer2 = _create_customer(org, store, email="c2@test.com")
        product = _create_product(org, store)
        Review.objects.create(
            organization=org,
            store=store,
            customer=customer1,
            product=product,
            rating=5,
            title="Great",
            body="Loved",
            is_approved=True,
        )
        Review.objects.create(
            organization=org,
            store=store,
            customer=customer2,
            product=product,
            rating=1,
            title="Bad",
            body="Hate",
            is_approved=False,
        )
        response = api_client.get(
            "/api/v1/customers/reviews/product-reviews/",
            {"product": str(product.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1  # Only approved

    def test_product_reviews_requires_product(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/customers/reviews/product-reviews/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_review_rating_validation(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        response = api_client.post(
            "/api/v1/customers/reviews/",
            {
                "store": str(store.id),
                "customer": str(customer.id),
                "product": str(product.id),
                "rating": 6,
                "title": "Too high",
                "body": "Invalid",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_customer_sub_resource_reviews(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        Review.objects.create(
            organization=org,
            store=store,
            customer=customer,
            product=product,
            rating=4,
            title="Good",
            body="Nice",
        )
        response = api_client.get(
            f"/api/v1/customers/customers/{customer.id}/reviews/",
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1


# ===========================================================================
# Loyalty
# ===========================================================================


class TestLoyalty:
    def test_manual_adjustment(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store, loyalty_points=100)
        response = api_client.post(
            "/api/v1/customers/loyalty-transactions/adjust/",
            {
                "customer_id": str(customer.id),
                "points": 50,
                "description": "Bonus points",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["points"] == 50
        assert response.data["balance"] == 150
        customer.refresh_from_db()
        assert customer.loyalty_points == 150

    def test_negative_adjustment(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store, loyalty_points=100)
        response = api_client.post(
            "/api/v1/customers/loyalty-transactions/adjust/",
            {
                "customer_id": str(customer.id),
                "points": -30,
                "description": "Redeemed",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["balance"] == 70
        customer.refresh_from_db()
        assert customer.loyalty_points == 70

    def test_adjust_insufficient_points(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store, loyalty_points=10)
        response = api_client.post(
            "/api/v1/customers/loyalty-transactions/adjust/",
            {
                "customer_id": str(customer.id),
                "points": -50,
                "description": "Not enough",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_zero_points_rejected(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        response = api_client.post(
            "/api/v1/customers/loyalty-transactions/adjust/",
            {
                "customer_id": str(customer.id),
                "points": 0,
                "description": "Zero",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_transactions(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        LoyaltyTransaction.objects.create(
            organization=org,
            store=store,
            customer=customer,
            type="earned",
            points=50,
            balance=50,
            description="Earned",
        )
        response = api_client.get(
            "/api/v1/customers/loyalty-transactions/",
            {"customer": str(customer.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pagination"]["total"] == 1

    def test_customer_sub_resource_loyalty(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        LoyaltyTransaction.objects.create(
            organization=org,
            store=store,
            customer=customer,
            type="earned",
            points=50,
            balance=50,
            description="Earned",
        )
        response = api_client.get(
            f"/api/v1/customers/customers/{customer.id}/loyalty_transactions/",
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1


# ===========================================================================
# Saved Cart
# ===========================================================================


class TestSavedCart:
    def test_create_saved_cart(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        response = api_client.post(
            "/api/v1/customers/saved-carts/",
            {"store": str(store.id), "customer": str(customer.id), "name": "Weekend list"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Weekend list"

    def test_list_saved_carts(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        SavedCart.objects.create(
            organization=org,
            store=store,
            customer=customer,
            name="Cart 1",
        )
        SavedCart.objects.create(
            organization=org,
            store=store,
            customer=customer,
            name="Cart 2",
        )
        response = api_client.get(
            "/api/v1/customers/saved-carts/",
            {"customer": str(customer.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pagination"]["total"] == 2

    def test_add_item_to_saved_cart(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        cart = SavedCart.objects.create(
            organization=org,
            store=store,
            customer=customer,
            name="My Cart",
        )
        response = api_client.post(
            f"/api/v1/customers/saved-carts/{cart.id}/add-item/",
            {
                "product_id": str(product.id),
                "quantity": 2,
                "unit_price": "29.99",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["quantity"] == 2

    def test_remove_item_from_saved_cart(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        product = _create_product(org, store)
        cart = SavedCart.objects.create(
            organization=org,
            store=store,
            customer=customer,
            name="My Cart",
        )
        item = SavedCartItem.objects.create(
            saved_cart=cart,
            product=product,
            quantity=1,
            unit_price=Decimal("29.99"),
        )
        response = api_client.delete(
            f"/api/v1/customers/saved-carts/{cart.id}/remove-item/",
            {"item_id": str(item.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not SavedCartItem.objects.filter(id=item.id).exists()

    def test_remove_item_requires_item_id(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        cart = SavedCart.objects.create(
            organization=org,
            store=store,
            customer=customer,
            name="My Cart",
        )
        response = api_client.delete(
            f"/api/v1/customers/saved-carts/{cart.id}/remove-item/",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_saved_cart(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        cart = SavedCart.objects.create(
            organization=org,
            store=store,
            customer=customer,
            name="Delete me",
        )
        response = api_client.delete(f"/api/v1/customers/saved-carts/{cart.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_customer_sub_resource_saved_carts(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        customer = _create_customer(org, store)
        SavedCart.objects.create(
            organization=org,
            store=store,
            customer=customer,
            name="Cart 1",
        )
        response = api_client.get(
            f"/api/v1/customers/customers/{customer.id}/saved_carts/",
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1


# ===========================================================================
# Address model
# ===========================================================================


class TestAddressModel:
    def test_default_unsets_others(self):
        user, org, store, _ = create_org_with_owner_and_store("model@example.com")
        customer = _create_customer(org, store)
        addr1 = Address.objects.create(
            organization=org,
            store=store,
            customer=customer,
            label="Home",
            address_line1="123",
            city="NY",
            country="US",
            is_default=True,
        )
        addr2 = Address.objects.create(
            organization=org,
            store=store,
            customer=customer,
            label="Work",
            address_line1="456",
            city="NY",
            country="US",
            is_default=True,
        )
        addr1.refresh_from_db()
        assert addr1.is_default is False
        assert addr2.is_default is True


class TestCustomerCartView:
    def _get_customer_token(self, customer):
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken()
        refresh["customer_id"] = str(customer.id)
        refresh["store_id"] = str(customer.store_id)
        refresh["org_id"] = str(customer.organization_id)
        refresh["email"] = customer.email
        return str(refresh.access_token)

    def test_cart_view_requires_auth(self, api_client):
        response = api_client.get("/api/v1/customers/cart/?store=any")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cart_view_missing_store_param(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("cart-missing-store@test.com")
        customer = _create_customer(org, store, email="cc1@test.com")
        token = self._get_customer_token(customer)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/customers/cart/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cart_view_store_not_found(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("cart-store-nf@test.com")
        customer = _create_customer(org, store, email="cc2@test.com")
        token = self._get_customer_token(customer)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/customers/cart/?store=nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cart_view_empty_cart(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("cart-empty@test.com")
        customer = _create_customer(org, store, email="cc3@test.com")
        token = self._get_customer_token(customer)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/customers/cart/?store={store.slug}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    def test_cart_view_with_items(self, api_client):
        from apps.orders.models import Cart

        user, org, store, _ = create_org_with_owner_and_store("cart-with-items@test.com")
        customer = _create_customer(org, store, email="cc4@test.com")
        token = self._get_customer_token(customer)
        product = _create_product(org, store, title="Cart Prod", sku="CP-1")
        cart = Cart.objects.create(
            organization=org, store=store, customer=customer, status="active"
        )
        from apps.orders.models import CartItem

        CartItem.objects.create(cart=cart, product=product, quantity=2, unit_price=product.price)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/customers/cart/?store={store.slug}")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_cart_actions_not_found(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("cart-notfound@test.com")
        customer = _create_customer(org, store, email="cc9@test.com")
        token = self._get_customer_token(customer)
        import uuid

        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/customers/cart/{uuid.uuid4()}/add/",
            {"product_id": str(uuid.uuid4()), "quantity": 1},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCustomerMergeCartView:
    def _get_customer_token(self, customer):
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken()
        refresh["customer_id"] = str(customer.id)
        refresh["store_id"] = str(customer.store_id)
        refresh["org_id"] = str(customer.organization_id)
        refresh["email"] = customer.email
        return str(refresh.access_token)

    def test_merge_cart_requires_auth(self, api_client):
        response = api_client.post("/api/v1/customers/auth/merge-cart/", {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_merge_cart_missing_store(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("merge-nostore@test.com")
        customer = _create_customer(org, store, email="mc1@test.com")
        token = self._get_customer_token(customer)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/customers/auth/merge-cart/",
            {"items": [{"product": "x", "quantity": 1}]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_merge_cart_missing_items(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("merge-noitems@test.com")
        customer = _create_customer(org, store, email="mc2@test.com")
        token = self._get_customer_token(customer)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/customers/auth/merge-cart/",
            {"store": store.slug},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_merge_cart_store_not_found(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("merge-storernf@test.com")
        customer = _create_customer(org, store, email="mc3@test.com")
        token = self._get_customer_token(customer)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/customers/auth/merge-cart/",
            {"store": "nonexistent", "items": [{"product": "x", "quantity": 1}]},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_merge_cart_success(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("merge-ok@test.com")
        customer = _create_customer(org, store, email="mc4@test.com")
        token = self._get_customer_token(customer)
        product = _create_product(org, store, title="Merge Prod", sku="MRG-1")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/customers/auth/merge-cart/",
            {
                "store": store.slug,
                "items": [{"product": str(product.id), "quantity": 3}],
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "cart_id" in response.data


class TestCustomerAuthViews:
    def test_register(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("cust-reg@test.com")
        response = api_client.post(
            f"/api/v1/customers/auth/{store.slug}/register/",
            {
                "email": "newcust@test.com",
                "password": "securepass123",
                "first_name": "New",
                "last_name": "Cust",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert "tokens" in response.data
        assert "customer" in response.data

    def test_login(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("cust-login@test.com")
        api_client.post(
            f"/api/v1/customers/auth/{store.slug}/register/",
            {
                "email": "logincust@test.com",
                "password": "securepass123",
            },
            format="json",
        )
        response = api_client.post(
            f"/api/v1/customers/auth/{store.slug}/login/",
            {"email": "logincust@test.com", "password": "securepass123"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "tokens" in response.data

    def test_login_wrong_password(self, api_client):
        user, org, store, _ = create_org_with_owner_and_store("cust-login2@test.com")
        api_client.post(
            f"/api/v1/customers/auth/{store.slug}/register/",
            {"email": "badpw@test.com", "password": "securepass123"},
            format="json",
        )
        response = api_client.post(
            f"/api/v1/customers/auth/{store.slug}/login/",
            {"email": "badpw@test.com", "password": "wrongpassword"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_view(self, api_client):
        from rest_framework_simplejwt.tokens import RefreshToken

        user, org, store, _ = create_org_with_owner_and_store("cust-me@test.com")
        customer = _create_customer(org, store, email="me-cust@test.com")
        refresh = RefreshToken()
        refresh["customer_id"] = str(customer.id)
        refresh["store_id"] = str(customer.store_id)
        refresh["org_id"] = str(customer.organization_id)
        refresh["email"] = customer.email
        token = str(refresh.access_token)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/customers/auth/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "me-cust@test.com"

    def test_token_refresh(self, api_client):
        from rest_framework_simplejwt.tokens import RefreshToken

        user, org, store, _ = create_org_with_owner_and_store("cust-refresh@test.com")
        customer = _create_customer(org, store, email="refresh-cust@test.com")
        refresh = RefreshToken()
        refresh["customer_id"] = str(customer.id)
        refresh["store_id"] = str(customer.store_id)
        refresh["org_id"] = str(customer.organization_id)
        refresh["email"] = customer.email
        response = api_client.post(
            "/api/v1/customers/auth/token/refresh/",
            {"refresh": str(refresh)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_logout(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cust-logout@test.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/customers/auth/logout/",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
