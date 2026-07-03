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


class TestStorefrontProductDetailLocale(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.store, _ = create_org_with_owner_and_store(
            "storefront-detail-locale@test.com"
        )
        self.product = Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Locale Product",
            slug="locale-product",
            price=29.99,
            status="active",
            translations={"ar": {"title": "منتج لغوي", "description": "وصف المنتج"}},
        )

    def test_product_detail_default_locale(self):
        response = self.client.get(f"/api/v1/store/{self.store.slug}/products/locale-product/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Locale Product"

    def test_product_detail_arabic_locale(self):
        response = self.client.get(
            f"/api/v1/store/{self.store.slug}/products/locale-product/?locale=ar"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "منتج لغوي"
        assert response.data["description"] == "وصف المنتج"

    def test_product_detail_store_not_found(self):
        response = self.client.get("/api/v1/store/nonexistent/products/locale-product/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_product_list_sorting(self):
        Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Alpha Product",
            slug="alpha-product",
            price=10.00,
            status="active",
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/products/?sort=price")
        assert response.status_code == status.HTTP_200_OK


class TestStorefrontCategoryCollectionDetail(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.store, _ = create_org_with_owner_and_store(
            "storefront-cc-detail@test.com"
        )

    def test_categories_with_products(self):
        cat = Category.objects.create(
            organization=self.org, store=self.store, name="Electronics", slug="electronics"
        )
        Product.objects.create(
            organization=self.org,
            store=self.store,
            title="Laptop",
            slug="laptop",
            price=999.99,
            status="active",
        )
        Product.objects.get(slug="laptop").categories.add(cat)
        response = self.client.get(f"/api/v1/store/{self.store.slug}/categories/")
        assert response.status_code == status.HTTP_200_OK

    def test_collections_with_products(self):
        coll = Collection.objects.create(
            organization=self.org, store=self.store, name="New Arrivals", slug="new-arrivals"
        )
        Product.objects.create(
            organization=self.org,
            store=self.store,
            title="New Item",
            slug="new-item",
            price=49.99,
            status="active",
        )
        coll.products.add(Product.objects.get(slug="new-item"))
        response = self.client.get(f"/api/v1/store/{self.store.slug}/collections/")
        assert response.status_code == status.HTTP_200_OK

    def test_categories_cache(self):
        from django.core.cache import cache

        response1 = self.client.get(f"/api/v1/store/{self.store.slug}/categories/")
        assert response1.status_code == status.HTTP_200_OK
        cache_key = f"storefront:categories:{self.store.slug}"
        assert cache.get(cache_key) is not None

        response2 = self.client.get(f"/api/v1/store/{self.store.slug}/categories/")
        assert response2.status_code == status.HTTP_200_OK


class TestStorefrontBlogDetail(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.org, self.store, _ = create_org_with_owner_and_store(
            "storefront-blog-detail@test.com"
        )

    def test_blog_post_detail(self):
        from apps.blog.models import BlogPost

        BlogPost.objects.create(
            organization=self.org,
            store=self.store,
            title="Test Blog Post",
            slug="test-blog-post",
            content="<p>Hello World</p>",
            status="published",
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/blog/test-blog-post/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Test Blog Post"

    def test_blog_post_not_published(self):
        from apps.blog.models import BlogPost

        BlogPost.objects.create(
            organization=self.org,
            store=self.store,
            title="Draft Post",
            slug="draft-post",
            content="<p>Draft</p>",
            status="draft",
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/blog/draft-post/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_blog_list_pagination(self):
        from apps.blog.models import BlogPost

        for i in range(5):
            BlogPost.objects.create(
                organization=self.org,
                store=self.store,
                title=f"Post {i}",
                slug=f"post-{i}",
                content=f"<p>Content {i}</p>",
                status="published",
            )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/blog/?per_page=2&page=1")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["posts"]) == 2
        assert response.data["pagination"]["total"] == 5

    def test_blog_list_filter_by_category(self):
        from apps.blog.models import BlogCategory, BlogPost, BlogPostCategory

        cat = BlogCategory.objects.create(
            organization=self.org,
            store=self.store,
            name="Tech",
            slug="tech",
        )
        post = BlogPost.objects.create(
            organization=self.org,
            store=self.store,
            title="Tech Post",
            slug="tech-post",
            content="<p>Tech</p>",
            status="published",
        )
        BlogPostCategory.objects.create(
            post=post,
            category=cat,
        )
        response = self.client.get(f"/api/v1/store/{self.store.slug}/blog/?category=tech")
        assert response.status_code == status.HTTP_200_OK
