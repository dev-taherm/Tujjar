from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.pages.models import Page
from apps.products.models import Category, Collection, Product
from tests.factories import create_org_with_owner_and_store


class TestStorefrontHome(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.store, self.token = create_org_with_owner_and_store(
            "storefront@test.com"
        )

    def test_home_store_not_found(self):
        response = self.client.get("/api/v1/store/nonexistent/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_home_success(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/")
        assert response.status_code == status.HTTP_200_OK
        assert "store" in response.data
        assert "featured_products" in response.data

    def test_home_with_locale(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/?locale=ar")
        assert response.status_code == status.HTTP_200_OK

    def test_home_invalid_locale(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/?locale=fr")
        assert response.status_code == status.HTTP_200_OK

    def test_home_with_homepage(self):
        Page.objects.create(
            organization=self.org,
            store=self.store,
            title="Home",
            slug="home",
            page_type="homepage",
            is_published=True,
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["homepage"] is not None

    def test_home_with_preview(self):
        Page.objects.create(
            organization=self.org,
            store=self.store,
            title="Draft Home",
            slug="draft-home",
            page_type="homepage",
            is_published=False,
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/?preview=true")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["homepage"] is not None

    def test_home_with_products(self):
        Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Test Product",
            slug="test-product",
            price=9.99,
            status="active",
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["featured_products"]) == 1

    def test_home_with_product_translations(self):
        Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Test Product",
            slug="test-product-2",
            price=9.99,
            status="active",
            translations={"ar": {"title": "منتج اختبار"}},
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/?locale=ar")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["featured_products"][0]["title"] == "منتج اختبار"

    def test_home_store_resolved_with_translations(self):
        self.store.translations = {"ar": {"name": "متجر اختبار"}}
        self.store.save(update_fields=["translations"])
        response = self.client.get(f"/api/v1/store/{self.store.slug}/?locale=ar")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["store"]["name"] == "متجر اختبار"

    def test_home_store_resolved_default_locale(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["store"]["name"] == self.store.name


class TestStorefrontProducts(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.store, _ = create_org_with_owner_and_store(
            "storefront-prod@test.com"
        )

    def test_list_products(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/products/")
        assert response.status_code == status.HTTP_200_OK

    def test_list_products_not_found(self):
        response = self.client.get("/api/v1/store/nonexistent/products/")
        assert response.status_code == status.HTTP_200_OK

    def test_product_detail_not_found(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/products/no-such/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_product_detail(self):
        Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Detail Product",
            slug="detail-product",
            price=19.99,
            status="active",
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/products/detail-product/")
        assert response.status_code == status.HTTP_200_OK

    def test_products_filter_category(self):
        cat = Category.objects.create(
            organization=self.org, store=self.store, name="Shoes", slug="shoes"
        )
        p = Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Shoe Product",
            slug="shoe-product",
            price=29.99,
            status="active",
        )
        p.categories.add(cat)
        response = self.client.get(f"/api/v1/store/{self.store.slug}/products/?category=shoes")
        assert response.status_code == status.HTTP_200_OK

    def test_products_filter_collection(self):
        coll = Collection.objects.create(
            organization=self.org, store=self.store, name="Summer", slug="summer"
        )
        Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Summer Product",
            slug="summer-product",
            price=39.99,
            status="active",
        )
        coll.products.add(
            Product.objects.get(slug="summer-product"),
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/products/?collection=summer")
        assert response.status_code == status.HTTP_200_OK

    def test_products_search(self):
        Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Searchable Widget",
            slug="searchable-widget",
            price=9.99,
            status="active",
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/products/?search=searchable")
        assert response.status_code == status.HTTP_200_OK


class TestStorefrontCategoriesCollections(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.store, _ = create_org_with_owner_and_store(
            "storefront-cc@test.com"
        )

    def test_categories(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/categories/")
        assert response.status_code == status.HTTP_200_OK

    def test_collections(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/collections/")
        assert response.status_code == status.HTTP_200_OK


class TestStorefrontPage(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.store, _ = create_org_with_owner_and_store(
            "storefront-page@test.com"
        )
        self.page = Page.objects.create(
            organization=self.org,
            store=self.store,
            title="About Us",
            slug="about",
            page_type="content",
            is_published=True,
        )

    def test_page_found(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/pages/about/")
        assert response.status_code == status.HTTP_200_OK

    def test_page_not_found(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/pages/no-page/")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestStorefrontBlog(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.store, _ = create_org_with_owner_and_store(
            "storefront-blog@test.com"
        )

    def test_blog_list(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/blog/")
        assert response.status_code == status.HTTP_200_OK

    def test_blog_categories(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/blog/categories/")
        assert response.status_code == status.HTTP_200_OK

    def test_blog_rss(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/blog/rss/")
        assert response.status_code == status.HTTP_200_OK

    def test_blog_subscribe(self):
        response = self.client.post(
            f"/api/v1/store/{self.store.slug}/blog/subscribe/",
            {"email": "subscriber@test.com"},
            format="json",
        )
        assert response.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)

    def test_blog_post_not_found(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/blog/no-post/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_robots_txt(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/robots.txt")
        assert response.status_code == status.HTTP_200_OK

    def test_sitemap_xml(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/sitemap.xml")
        assert response.status_code == status.HTTP_200_OK
