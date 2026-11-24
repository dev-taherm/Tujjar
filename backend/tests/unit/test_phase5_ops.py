from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import create_org_with_owner_and_store

pytestmark = pytest.mark.django_db


@pytest.fixture
def analytics_data(db):
    from apps.analytics.models import DailyStats, Event
    from apps.orders.models import Order, OrderItem

    user, org, store, token = create_org_with_owner_and_store("metrics@example.com")
    today = timezone.now().date()

    DailyStats.objects.create(
        organization=org,
        store=store,
        date=today,
        total_revenue=Decimal("1000.00"),
        total_orders=10,
        total_visitors=100,
        total_products_sold=25,
        traffic_sources={"google.com": 40, "direct": 30},
    )
    order = Order.objects.create(
        organization=org,
        store=store,
        customer_email="a@example.com",
        status="delivered",
        payment_status="paid",
        subtotal=Decimal("120.00"),
        total=Decimal("120.00"),
    )
    OrderItem.objects.create(
        order=order,
        title="Best Widget",
        sku="BW-1",
        quantity=3,
        unit_price=Decimal("40.00"),
        total_price=Decimal("120.00"),
    )
    Event.objects.create(
        organization=org,
        event_type="page_view",
        referrer="https://www.google.com/search?q=widgets",
    )
    Event.objects.create(
        organization=org,
        event_type="page_view",
        referrer="https://www.google.com/search?q=more",
    )
    return {"org": org, "store": store, "token": token, "order": order}


class TestAnalyticsSummary:
    def test_top_products_and_traffic_sources(self, analytics_data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {analytics_data['token']}")
        response = client.get("/api/v1/analytics/events/summary/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["top_products"], "top_products should not be empty"
        assert response.data["top_products"][0]["title"] == "Best Widget"
        assert response.data["top_products"][0]["revenue"] == 120.0
        assert response.data["top_products"][0]["units_sold"] == 3
        assert "www.google.com" in response.data["traffic_sources"]

    def test_revenue_chart_data(self, analytics_data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {analytics_data['token']}")
        response = client.get("/api/v1/analytics/events/revenue_chart/?period=day")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"], "chart should include the seeded day"


class TestProductCsv:
    def test_export_contains_products(self, analytics_data):
        from apps.products.models import Product

        Product.objects.create(
            organization=analytics_data["org"],
            store=analytics_data["store"],
            title="CSV Widget",
            slug="csv-widget",
            product_type="physical",
            status="active",
            price=Decimal("10.00"),
            sku="CSV-1",
        )
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {analytics_data['token']}")
        response = client.get("/api/v1/products/import-export/export/")
        assert response.status_code == status.HTTP_200_OK
        assert "CSV Widget" in response.content.decode("utf-8")
        assert "title,sku,price" in response.content.decode("utf-8")

    def test_import_creates_and_updates(self, analytics_data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {analytics_data['token']}")

        csv_content = (
            "title,sku,price,description,status,collection,tags,inventory_quantity\n"
            "Imported Gadget,IMP-1,19.99,Description here,active,Tools,cool;new,7\n"
            ",,9.99,,,,,\n"
        )
        from django.core.files.uploadedfile import SimpleUploadedFile

        upload = SimpleUploadedFile(
            "products.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )
        response = client.post(
            "/api/v1/products/import-export/import/", {"file": upload}, format="multipart"
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["created"] == 1
        assert response.data["updated"] == 0
        assert response.data["failed"] == 1
        assert "Missing title" in response.data["errors"][0]["error"]

        from apps.products.models import Collection, Product

        assert Product.unscoped.filter(title="Imported Gadget").exists()
        assert Collection.unscoped.filter(name="Tools").exists()

        # Re-import with the same SKU updates the existing product
        csv_update = (
            "title,sku,price,status\n"
            "Imported Gadget Updated,IMP-1,29.99,active\n"
        )
        upload2 = SimpleUploadedFile(
            "products.csv", csv_update.encode("utf-8"), content_type="text/csv"
        )
        response2 = client.post(
            "/api/v1/products/import-export/import/", {"file": upload2}, format="multipart"
        )
        assert response2.status_code == status.HTTP_200_OK
        assert response2.data["updated"] == 1
        assert response2.data["created"] == 0

        product = Product.unscoped.get(sku="IMP-1")
        assert product.title == "Imported Gadget Updated"
        assert Decimal(str(product.price)) == Decimal("29.99")
