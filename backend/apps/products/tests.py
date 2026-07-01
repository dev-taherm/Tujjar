from decimal import Decimal

import pytest
from rest_framework import status
from tests.factories import create_org_with_owner_and_store

from apps.products.models import (
    Category,
    Collection,
    InventoryMovement,
    Product,
    ProductImage,
    ProductOption,
    ProductOptionValue,
    ProductVariant,
)

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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
# Product CRUD
# ===========================================================================


class TestProductCRUD:
    def test_create_product(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("owner1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/products/",
            {
                "store": str(store.id),
                "title": "New Product",
                "slug": "new-product",
                "description": "A great product",
                "product_type": "physical",
                "status": "active",
                "price": "49.99",
                "sku": "NP-001",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "New Product"
        assert response.data["price"] == "49.99"

    def test_create_product_auto_slug(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("slug@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/products/",
            {
                "store": str(store.id),
                "title": "Auto Slug Product",
                "slug": "auto-slug-product",
                "price": "10.00",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["slug"] == "auto-slug-product"

    def test_list_products(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("list@example.com")
        _create_product(org, store, title="Listed Product", slug="listed-product")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1

    def test_retrieve_product(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("retrieve@example.com")
        product = _create_product(org, store, title="Retrieved Product", slug="retrieved-product")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/products/{product.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Retrieved Product"

    def test_update_product(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("update@example.com")
        product = _create_product(org, store, title="Old Title", slug="update-product")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/products/{product.id}/",
            {"title": "Updated Product"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Updated Product"

    def test_delete_product(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("delete@example.com")
        product = _create_product(org, store, title="Doomed Product", slug="delete-product")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(f"/api/v1/products/{product.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_list_products_unauthenticated(self, api_client):
        response = api_client.get("/api/v1/products/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_duplicate_product(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("dup@example.com")
        product = _create_product(org, store, title="Original", slug="original", sku="ORI-001")
        ProductVariant.objects.create(
            product=product,
            title="Small",
            price=Decimal("19.99"),
            option1="Small",
        )
        ProductImage.objects.create(
            product=product, url="https://example.com/img.jpg", position=0, is_primary=True
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(f"/api/v1/products/{product.id}/duplicate/", format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "Original (Copy)"
        assert response.data["status"] == "draft"
        assert ProductVariant.objects.filter(product__id=response.data["id"]).count() == 1
        assert ProductImage.objects.filter(product__id=response.data["id"]).count() == 1

    def test_category_assignment(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("catassign@example.com")
        cat = Category.objects.create(organization=org, store=store, name="Shoes", slug="shoes")
        product = _create_product(org, store)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/products/{product.id}/",
            {"category_ids": [str(cat.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, f"Error: {response.data}"
        product.refresh_from_db()
        assert product.categories.count() == 1

    def test_tags_field(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("tags@example.com")
        product = _create_product(org, store)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/products/{product.id}/",
            {"tags": ["summer", "sale"]},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["tags"] == ["summer", "sale"]

    def test_seo_fields(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("seo@example.com")
        product = _create_product(org, store)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/products/{product.id}/",
            {"seo_title": "Best Product", "seo_description": "Buy now"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["seo_title"] == "Best Product"
        assert response.data["seo_description"] == "Buy now"


# ===========================================================================
# Product Filtering
# ===========================================================================


class TestProductFiltering:
    def _setup(self, email):
        user, org, store, token = create_org_with_owner_and_store(email)
        _create_product(
            org,
            store,
            title="Active Product",
            slug=f"active-{email.split('@')[0]}",
            status="active",
            price=Decimal("10.00"),
        )
        _create_product(
            org,
            store,
            title="Draft Product",
            slug=f"draft-{email.split('@')[0]}",
            status="draft",
            price=Decimal("20.00"),
        )
        return token, org, store

    def test_filter_by_status(self, api_client):
        token, _, _ = self._setup("filter1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/", {"status": "active"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert all(p["status"] == "active" for p in results)

    def test_search_products(self, api_client):
        token, _, _ = self._setup("filter2@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/", {"search": "Active"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1

    def test_filter_by_price_range(self, api_client):
        token, org, store = self._setup("filter3@example.com")
        _create_product(org, store, title="Cheap", slug="cheap", price=Decimal("5.00"))
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/", {"min_price": "8", "max_price": "15"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert all(8 <= float(p["price"]) <= 15 for p in results)

    def test_filter_in_stock(self, api_client):
        token, org, store = self._setup("filter4@example.com")
        _create_product(
            org,
            store,
            title="InStock",
            slug="in-stock",
            inventory_quantity=10,
            track_inventory=True,
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/", {"in_stock": "true"})
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_category(self, api_client):
        token, org, store = self._setup("filter5@example.com")
        cat = Category.objects.create(organization=org, store=store, name="Books", slug="books")
        product = _create_product(org, store, title="Book Product", slug="book-prod")
        product.categories.add(cat)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/", {"category": str(cat.id)})
        assert response.status_code == status.HTTP_200_OK

    def test_low_stock_endpoint(self, api_client):
        token, org, store = self._setup("filter6@example.com")
        _create_product(
            org,
            store,
            title="LowStock",
            slug="low-stock",
            inventory_quantity=2,
            low_stock_threshold=5,
            track_inventory=True,
            status="active",
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/low-stock/")
        assert response.status_code == status.HTTP_200_OK

    def test_inventory_update(self, api_client):
        token, org, store = self._setup("filter7@example.com")
        product = _create_product(
            org, store, title="InvUpdate", slug="inv-update", inventory_quantity=10
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/products/{product.id}/inventory/update/",
            {"adjustment": -3, "reason": "sale", "reference": "ORD-001"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["inventory_quantity"] == 7
        assert InventoryMovement.objects.filter(product=product, adjustment=-3).exists()


# ===========================================================================
# Category CRUD
# ===========================================================================


class TestCategoryCRUD:
    def test_create_category(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/products/categories/",
            {"store": str(store.id), "name": "Electronics", "slug": "electronics"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Electronics"

    def test_create_category_auto_slug(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("catslug@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/products/categories/",
            {"store": str(store.id), "name": "Home & Garden", "slug": "home-garden"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["slug"] == "home-garden"

    def test_list_categories(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat2@example.com")
        Category.objects.create(organization=org, store=store, name="Books", slug="books")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/categories/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1

    def test_update_category(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat3@example.com")
        cat = Category.objects.create(organization=org, store=store, name="Old", slug="old-cat")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/products/categories/{cat.id}/",
            {"name": "New Name"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "New Name"

    def test_delete_category(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat4@example.com")
        cat = Category.objects.create(
            organization=org, store=store, name="Delete Me", slug="del-cat"
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(f"/api/v1/products/categories/{cat.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_category_hierarchy(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat5@example.com")
        parent = Category.objects.create(
            organization=org, store=store, name="Parent", slug="parent-cat"
        )
        _child = Category.objects.create(
            organization=org, store=store, name="Child", slug="child-cat", parent=parent
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/products/categories/{parent.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["children"]) == 1

    def test_category_filter_by_store(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat6@example.com")
        Category.objects.create(organization=org, store=store, name="StoreCat", slug="store-cat")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/categories/", {"store": str(store.id)})
        assert response.status_code == status.HTTP_200_OK

    def test_category_seo_fields(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat7@example.com")
        cat = Category.objects.create(organization=org, store=store, name="SeoCat", slug="seo-cat")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/products/categories/{cat.id}/",
            {"seo_title": "SEO Title", "seo_description": "SEO Desc"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["seo_title"] == "SEO Title"

    def test_category_product_count(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("cat8@example.com")
        cat = Category.objects.create(
            organization=org, store=store, name="CountCat", slug="count-cat"
        )
        product = _create_product(org, store)
        product.categories.add(cat)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/products/categories/{cat.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["product_count"] == 1


# ===========================================================================
# Collection CRUD
# ===========================================================================


class TestCollectionCRUD:
    def test_create_collection(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("col1@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/products/collections/",
            {"store": str(store.id), "name": "Summer Sale", "slug": "summer-sale"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Summer Sale"

    def test_create_collection_auto_slug(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("colslug@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/products/collections/",
            {
                "store": str(store.id),
                "name": "Winter Collection 2024",
                "slug": "winter-collection-2024",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["slug"] == "winter-collection-2024"

    def test_list_collections(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("col2@example.com")
        Collection.objects.create(organization=org, store=store, name="ColList", slug="col-list")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/collections/")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_collection_with_products(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("col3@example.com")
        col = Collection.objects.create(
            organization=org, store=store, name="DetailCol", slug="detail-col"
        )
        product = _create_product(org, store, title="Col Product", slug="col-prod")
        col.products.add(product)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/products/collections/{col.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["product_count"] == 1
        assert len(response.data["products"]) == 1

    def test_update_collection_product_ids(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("col4@example.com")
        col = Collection.objects.create(
            organization=org, store=store, name="UpdCol", slug="upd-col"
        )
        product = _create_product(org, store, title="AddMe", slug="add-me")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/products/collections/{col.id}/",
            {"product_ids": [str(product.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert col.products.count() == 1

    def test_delete_collection(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("col5@example.com")
        col = Collection.objects.create(
            organization=org, store=store, name="DelCol", slug="del-col"
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(f"/api/v1/products/collections/{col.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_collection_seo_fields(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("col6@example.com")
        col = Collection.objects.create(
            organization=org, store=store, name="SeoCol", slug="seo-col"
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.patch(
            f"/api/v1/products/collections/{col.id}/",
            {"seo_title": "Collection SEO", "seo_description": "Desc"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["seo_title"] == "Collection SEO"


# ===========================================================================
# Product Variants
# ===========================================================================


class TestProductVariantCRUD:
    def test_create_variant(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("var1@example.com")
        product = _create_product(org, store)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/products/{product.id}/variants/",
            {"title": "Small Red", "price": "24.99", "option1": "Small", "option2": "Red"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "Small Red"

    def test_list_variants(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("var2@example.com")
        product = _create_product(org, store)
        ProductVariant.objects.create(product=product, title="V1", price=Decimal("10.00"))
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/products/{product.id}/variants/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) == 1

    def test_update_variant(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("var3@example.com")
        product = _create_product(org, store)
        variant = ProductVariant.objects.create(
            product=product, title="Old", price=Decimal("10.00")
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.put(
            f"/api/v1/products/{product.id}/variants/{variant.id}/",
            {"title": "New", "price": "15.00"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "New"

    def test_delete_variant(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("var4@example.com")
        product = _create_product(org, store)
        variant = ProductVariant.objects.create(product=product, title="Del", price=Decimal("5.00"))
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(f"/api/v1/products/{product.id}/variants/{variant.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_variant_inventory_update(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("var5@example.com")
        product = _create_product(org, store)
        variant = ProductVariant.objects.create(
            product=product, title="InvVar", price=Decimal("10.00"), inventory_quantity=20
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/products/{product.id}/variants/{variant.id}/inventory/update/",
            {"adjustment": -5, "reason": "sale"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["inventory_quantity"] == 15
        assert InventoryMovement.objects.filter(product=product, variant=variant).exists()


# ===========================================================================
# Product Images
# ===========================================================================


class TestProductImageCRUD:
    def test_add_image(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("img1@example.com")
        product = _create_product(org, store)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/products/{product.id}/images/",
            {"url": "https://example.com/photo.jpg", "alt_text": "Photo", "position": 0},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_set_primary_image(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("img2@example.com")
        product = _create_product(org, store)
        img1 = ProductImage.objects.create(
            product=product, url="https://a.com/1.jpg", position=0, is_primary=True
        )
        img2 = ProductImage.objects.create(product=product, url="https://a.com/2.jpg", position=1)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(f"/api/v1/products/{product.id}/images/{img2.id}/set-primary/")
        assert response.status_code == status.HTTP_200_OK
        img1.refresh_from_db()
        img2.refresh_from_db()
        assert img1.is_primary is False
        assert img2.is_primary is True

    def test_delete_image(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("img3@example.com")
        product = _create_product(org, store)
        img = ProductImage.objects.create(product=product, url="https://a.com/del.jpg")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(f"/api/v1/products/{product.id}/images/{img.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_image_file_url_from_media_asset(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("img4@example.com")
        product = _create_product(org, store)
        img = ProductImage.objects.create(product=product, url="https://fallback.com/img.jpg")
        assert img.file_url == "https://fallback.com/img.jpg"


# ===========================================================================
# Product Options (Attributes)
# ===========================================================================


class TestProductOptionCRUD:
    def test_create_option(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("opt1@example.com")
        product = _create_product(org, store)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/products/{product.id}/options/",
            {"name": "Color", "position": 1},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Color"

    def test_add_option_value(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("opt2@example.com")
        product = _create_product(org, store)
        option = ProductOption.objects.create(product=product, name="Size", position=1)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            f"/api/v1/products/{product.id}/options/{option.id}/values/",
            {"value": "Large", "swatch": "#FF0000"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["value"] == "Large"

    def test_delete_option_value(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("opt3@example.com")
        product = _create_product(org, store)
        option = ProductOption.objects.create(product=product, name="Color", position=1)
        value = ProductOptionValue.objects.create(option=option, value="Red")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(
            f"/api/v1/products/{product.id}/options/{option.id}/values/{value.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_option(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("opt4@example.com")
        product = _create_product(org, store)
        option = ProductOption.objects.create(product=product, name="Material", position=2)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.delete(f"/api/v1/products/{product.id}/options/{option.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_list_options_with_values(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("opt5@example.com")
        product = _create_product(org, store)
        option = ProductOption.objects.create(product=product, name="Color", position=1)
        ProductOptionValue.objects.create(option=option, value="Red", sort_order=0)
        ProductOptionValue.objects.create(option=option, value="Blue", sort_order=1)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/products/{product.id}/options/")
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) == 1
        assert len(results[0]["values"]) == 2


# ===========================================================================
# Inventory Movements
# ===========================================================================


class TestInventoryMovement:
    def test_movement_created_on_inventory_update(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("inv1@example.com")
        product = _create_product(org, store, inventory_quantity=100)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        api_client.post(
            f"/api/v1/products/{product.id}/inventory/update/",
            {"adjustment": -10, "reason": "sale", "reference": "ORD-123"},
            format="json",
        )
        movement = InventoryMovement.objects.latest("created_at")
        assert movement.product == product
        assert movement.adjustment == -10
        assert movement.reason == "sale"
        assert movement.reference == "ORD-123"

    def test_list_movements(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("inv2@example.com")
        product = _create_product(org, store)
        InventoryMovement.objects.create(product=product, adjustment=5, reason="restock")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/inventory-movements/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_movements_by_product(self, api_client):
        user, org, store, token = create_org_with_owner_and_store("inv3@example.com")
        p1 = _create_product(org, store, title="P1", slug="p1")
        p2 = _create_product(org, store, title="P2", slug="p2")
        InventoryMovement.objects.create(product=p1, adjustment=1, reason="restock")
        InventoryMovement.objects.create(product=p2, adjustment=2, reason="restock")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/products/inventory-movements/", {"product": str(p1.id)})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data.get("results", response.data)) == 1
