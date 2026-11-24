import pytest
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


def make_order(org, store, status="pending"):
    from apps.orders.models import Order

    return Order.objects.create(
        organization=org,
        store=store,
        customer_email="bulk@example.com",
        subtotal=10,
        total=10,
        status=status,
    )


class TestBulkOrderActions:
    def test_bulk_confirm_multiple(self, db):
        user, org, store, token = create_org_with_owner_and_store("bulk@example.com")
        o1 = make_order(org, store)
        o2 = make_order(org, store)

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.post(
            "/api/v1/orders/orders/bulk-action/",
            {"ids": [str(o1.id), str(o2.id)], "action": "confirm"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["applied"] == 2
        assert response.data["skipped"] == 0
        o1.refresh_from_db()
        o2.refresh_from_db()
        assert o1.status == "confirmed"
        assert o2.status == "confirmed"

    def test_invalid_transitions_skipped(self, db):
        user, org, store, token = create_org_with_owner_and_store("bulkskip@example.com")
        delivered = make_order(org, store, status="delivered")
        pending = make_order(org, store, status="pending")

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.post(
            "/api/v1/orders/orders/bulk-action/",
            {"ids": [str(delivered.id), str(pending.id)], "action": "cancel"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["applied"] == 1
        assert response.data["skipped"] == 1
        delivered.refresh_from_db()
        assert delivered.status == "delivered"  # delivered → cancelled is invalid

    def test_invalid_action_rejected(self, db):
        user, org, store, token = create_org_with_owner_and_store("bulkbad@example.com")
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.post(
            "/api/v1/orders/orders/bulk-action/",
            {"ids": [], "action": "explode"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
