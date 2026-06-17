from decimal import Decimal

from django.test import TestCase

from apps.products.models import Category, Product


class TestProductModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store

        self.user = User.objects.create_user(email="prod@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test", slug="test-prod-org")
        self.store = Store.objects.create(
            organization=self.org,
            name="Prod Store",
            slug="prod-store",
        )

    def test_create_product(self):
        product = Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Test Product",
            slug="test-product",
            description="A test product",
            product_type="physical",
            status="active",
            price=Decimal("29.99"),
            sku="TEST-001",
        )
        self.assertEqual(str(product), "Test Product")
        self.assertEqual(product.price, Decimal("29.99"))

    def test_product_slug_unique(self):
        Product.objects.create(
            organization=self.org,
            store=self.store,
            title="P1",
            slug="dup-slug",
            price=Decimal("10"),
            sku="P1-001",
        )
        with self.assertRaises(Exception):
            Product.objects.create(
                organization=self.org,
                store=self.store,
                title="P2",
                slug="dup-slug",
                price=Decimal("20"),
                sku="P2-001",
            )


class TestCategoryModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store

        self.user = User.objects.create_user(email="cat@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test Cat", slug="test-cat-org")
        self.store = Store.objects.create(
            organization=self.org,
            name="Cat Store",
            slug="cat-store",
        )

    def test_create_category(self):
        cat = Category.objects.create(
            organization=self.org,
            store=self.store,
            name="Electronics",
            slug="electronics",
        )
        self.assertEqual(str(cat), "Electronics")

    def test_category_hierarchy(self):
        parent = Category.objects.create(
            organization=self.org,
            store=self.store,
            name="Parent",
            slug="parent",
        )
        child = Category.objects.create(
            organization=self.org,
            store=self.store,
            name="Child",
            slug="child",
            parent=parent,
        )
        self.assertEqual(child.parent, parent)
