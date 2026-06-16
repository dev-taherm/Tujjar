from __future__ import annotations

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.blog.models import (
    BlogAuthor,
    BlogCategory,
    BlogComment,
    BlogPost,
    BlogPostCategory,
    BlogPostTag,
    BlogSubscriber,
    BlogTag,
)
from tests.factories import create_org_with_owner_and_store
from tests.factories.blog import (
    BlogAuthorFactory,
    BlogCategoryFactory,
    BlogCommentFactory,
    BlogPostFactory,
    BlogPostCategoryFactory,
    BlogPostTagFactory,
    BlogSubscriberFactory,
    BlogTagFactory,
)


class BlogCategoryAPITests(TestCase):
    """Tests for BlogCategory CRUD."""

    def setUp(self):
        self.user, self.org, self.store, self.token = create_org_with_owner_and_store()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.base_url = "/api/v1/blog/categories/"

    def test_create_category(self):
        response = self.client.post(self.base_url, {
            "store": str(self.store.id),
            "name": "Technology",
            "slug": "technology",
            "description": "Tech articles",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Technology")
        self.assertEqual(response.data["slug"], "technology")

    def test_list_categories(self):
        BlogCategoryFactory(organization=self.org, store=self.store, name="Cat 1")
        BlogCategoryFactory(organization=self.org, store=self.store, name="Cat 2")
        response = self.client.get(f"{self.base_url}?store={self.store.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_category(self):
        cat = BlogCategoryFactory(organization=self.org, store=self.store)
        response = self.client.patch(f"{self.base_url}{cat.id}/", {"name": "Updated"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated")

    def test_delete_category(self):
        cat = BlogCategoryFactory(organization=self.org, store=self.store)
        response = self.client.delete(f"{self.base_url}{cat.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(BlogCategory.objects.filter(id=cat.id).exists())

    def test_category_slug_unique_per_store(self):
        BlogCategoryFactory(organization=self.org, store=self.store, slug="unique-slug")
        response = self.client.post(self.base_url, {
            "store": str(self.store.id),
            "name": "Duplicate",
            "slug": "unique-slug",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class BlogTagAPITests(TestCase):
    """Tests for BlogTag CRUD."""

    def setUp(self):
        self.user, self.org, self.store, self.token = create_org_with_owner_and_store()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.base_url = "/api/v1/blog/tags/"

    def test_create_tag(self):
        response = self.client.post(self.base_url, {
            "store": str(self.store.id),
            "name": "Python",
            "slug": "python",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Python")

    def test_list_tags(self):
        BlogTagFactory(organization=self.org, store=self.store)
        response = self.client.get(f"{self.base_url}?store={self.store.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_tag(self):
        tag = BlogTagFactory(organization=self.org, store=self.store)
        response = self.client.delete(f"{self.base_url}{tag.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class BlogAuthorAPITests(TestCase):
    """Tests for BlogAuthor CRUD."""

    def setUp(self):
        self.user, self.org, self.store, self.token = create_org_with_owner_and_store()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.base_url = "/api/v1/blog/authors/"

    def test_create_author(self):
        response = self.client.post(self.base_url, {
            "store": str(self.store.id),
            "name": "John Doe",
            "slug": "john-doe",
            "bio": "Tech writer",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "John Doe")

    def test_list_authors(self):
        BlogAuthorFactory(organization=self.org, store=self.store)
        response = self.client.get(f"{self.base_url}?store={self.store.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class BlogPostAPITests(TestCase):
    """Tests for BlogPost CRUD and actions."""

    def setUp(self):
        self.user, self.org, self.store, self.token = create_org_with_owner_and_store()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.base_url = "/api/v1/blog/posts/"
        self.author = BlogAuthorFactory(organization=self.org, store=self.store)

    def test_create_post(self):
        response = self.client.post(self.base_url, {
            "store": str(self.store.id),
            "title": "My First Post",
            "slug": "my-first-post",
            "excerpt": "A great post",
            "content": "<p>Content here</p>",
            "author": str(self.author.id),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "My First Post")
        self.assertEqual(response.data["status"], "draft")

    def test_list_posts(self):
        BlogPostFactory(organization=self.org, store=self.store, status="published")
        BlogPostFactory(organization=self.org, store=self.store, status="draft")
        response = self.client.get(f"{self.base_url}?store={self.store.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_posts_filter_by_status(self):
        BlogPostFactory(organization=self.org, store=self.store, status="published")
        BlogPostFactory(organization=self.org, store=self.store, status="draft")
        response = self.client.get(f"{self.base_url}?store={self.store.id}&status=published")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_post(self):
        post = BlogPostFactory(organization=self.org, store=self.store)
        response = self.client.patch(f"{self.base_url}{post.id}/", {
            "title": "Updated Title",
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Title")

    def test_delete_post(self):
        post = BlogPostFactory(organization=self.org, store=self.store)
        response = self.client.delete(f"{self.base_url}{post.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(BlogPost.objects.filter(id=post.id).exists())

    def test_publish_post(self):
        post = BlogPostFactory(organization=self.org, store=self.store, status="draft")
        response = self.client.post(f"{self.base_url}{post.id}/publish/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "published")
        self.assertIsNotNone(response.data["published_at"])

    def test_unpublish_post(self):
        post = BlogPostFactory(
            organization=self.org, store=self.store,
            status="published", published_at=timezone.now(),
        )
        response = self.client.post(f"{self.base_url}{post.id}/unpublish/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "draft")

    def test_archive_post(self):
        post = BlogPostFactory(organization=self.org, store=self.store, status="published")
        response = self.client.post(f"{self.base_url}{post.id}/archive/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "archived")

    def test_schedule_post(self):
        post = BlogPostFactory(organization=self.org, store=self.store, status="draft")
        scheduled_at = (timezone.now() + timezone.timedelta(hours=1)).isoformat()
        response = self.client.post(f"{self.base_url}{post.id}/schedule/", {
            "scheduled_at": scheduled_at,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "scheduled")

    def test_schedule_post_without_date(self):
        post = BlogPostFactory(organization=self.org, store=self.store)
        response = self.client.post(f"{self.base_url}{post.id}/schedule/", {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_set_featured(self):
        post = BlogPostFactory(organization=self.org, store=self.store, is_featured=False)
        response = self.client.post(f"{self.base_url}{post.id}/set-featured/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_featured"])

    def test_get_stats(self):
        post = BlogPostFactory(organization=self.org, store=self.store, view_count=42)
        BlogCommentFactory(
            organization=self.org, store=self.store, post=post, status="approved",
        )
        response = self.client.get(f"{self.base_url}{post.id}/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["view_count"], 42)
        self.assertEqual(response.data["comment_count"], 1)

    def test_auto_save(self):
        post = BlogPostFactory(organization=self.org, store=self.store)
        response = self.client.post(f"{self.base_url}{post.id}/auto-save/", {
            "title": "Auto Saved Title",
            "content": "<p>New content</p>",
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["saved"])

    def test_post_slug_unique_per_store(self):
        BlogPostFactory(organization=self.org, store=self.store, slug="same-slug")
        response = self.client.post(self.base_url, {
            "store": str(self.store.id),
            "title": "Duplicate",
            "slug": "same-slug",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reading_time_calculation(self):
        post = BlogPostFactory(
            organization=self.org, store=self.store,
            content="<p>" + "word " * 400 + "</p>",
        )
        post.calculate_reading_time()
        post.save(update_fields=["reading_time"])
        self.assertEqual(post.reading_time, 2)


class BlogCommentAPITests(TestCase):
    """Tests for BlogComment CRUD and moderation."""

    def setUp(self):
        self.user, self.org, self.store, self.token = create_org_with_owner_and_store()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.base_url = "/api/v1/blog/comments/"
        self.post = BlogPostFactory(
            organization=self.org, store=self.store, status="published",
        )

    def test_approve_comment(self):
        comment = BlogCommentFactory(
            organization=self.org, store=self.store, post=self.post, status="pending",
        )
        response = self.client.post(f"{self.base_url}{comment.id}/approve/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "approved")

    def test_reject_comment(self):
        comment = BlogCommentFactory(
            organization=self.org, store=self.store, post=self.post, status="pending",
        )
        response = self.client.post(f"{self.base_url}{comment.id}/reject/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "spam")

    def test_trash_comment(self):
        comment = BlogCommentFactory(
            organization=self.org, store=self.store, post=self.post, status="pending",
        )
        response = self.client.post(f"{self.base_url}{comment.id}/trash/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "trash")

    def test_approve_all_comments(self):
        BlogCommentFactory(
            organization=self.org, store=self.store, post=self.post, status="pending",
        )
        BlogCommentFactory(
            organization=self.org, store=self.store, post=self.post, status="pending",
        )
        response = self.client.post(f"{self.base_url}approve-all/", {
            "store": str(self.store.id),
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["approved"], 2)

    def test_list_comments_filter_by_status(self):
        BlogCommentFactory(
            organization=self.org, store=self.store, post=self.post, status="pending",
        )
        BlogCommentFactory(
            organization=self.org, store=self.store, post=self.post, status="approved",
        )
        response = self.client.get(f"{self.base_url}?store={self.store.id}&status=pending")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class BlogSubscriberAPITests(TestCase):
    """Tests for BlogSubscriber management."""

    def setUp(self):
        self.user, self.org, self.store, self.token = create_org_with_owner_and_store()
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.base_url = "/api/v1/blog/subscribers/"

    def test_list_subscribers(self):
        BlogSubscriberFactory(organization=self.org, store=self.store)
        response = self.client.get(f"{self.base_url}?store={self.store.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unsubscribe(self):
        subscriber = BlogSubscriberFactory(
            organization=self.org, store=self.store, is_active=True,
        )
        response = self.client.post(f"{self.base_url}{subscriber.id}/unsubscribe/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        subscriber.refresh_from_db()
        self.assertFalse(subscriber.is_active)
        self.assertIsNotNone(subscriber.unsubscribed_at)


class StorefrontBlogAPITests(TestCase):
    """Tests for public storefront blog endpoints."""

    def setUp(self):
        self.user, self.org, self.store, self.token = create_org_with_owner_and_store()
        self.client = APIClient()
        self.published_post = BlogPostFactory(
            organization=self.org, store=self.store,
            status="published", published_at=timezone.now(),
            title="Published Post", slug="published-post",
        )
        self.draft_post = BlogPostFactory(
            organization=self.org, store=self.store,
            status="draft", title="Draft Post",
        )

    def test_blog_list_returns_published_only(self):
        response = self.client.get(
            f"/api/v1/store/{self.store.slug}/blog/?locale=en",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["posts"]), 1)
        self.assertEqual(response.data["posts"][0]["title"], "Published Post")

    def test_blog_post_detail(self):
        response = self.client.get(
            f"/api/v1/store/{self.store.slug}/blog/published-post/?locale=en",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Published Post")

    def test_blog_post_detail_not_found(self):
        response = self.client.get(
            f"/api/v1/store/{self.store.slug}/blog/nonexistent/?locale=en",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_blog_post_increments_view_count(self):
        self.client.get(
            f"/api/v1/store/{self.store.slug}/blog/published-post/?locale=en",
        )
        self.published_post.refresh_from_db()
        self.assertEqual(self.published_post.view_count, 1)

    def test_blog_categories(self):
        cat = BlogCategoryFactory(
            organization=self.org, store=self.store, name="Tech",
        )
        BlogPostCategoryFactory(post=self.published_post, category=cat)
        response = self.client.get(
            f"/api/v1/store/{self.store.slug}/blog/categories/?locale=en",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Tech")

    def test_store_not_found(self):
        response = self.client.get("/api/v1/store/nonexistent/blog/?locale=en")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_blog_subscribe(self):
        response = self.client.post(
            f"/api/v1/store/{self.store.slug}/blog/subscribe/",
            {"email": "new@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            BlogSubscriber.objects.filter(
                store=self.store, email="new@example.com",
            ).exists()
        )

    def test_blog_subscribe_duplicate(self):
        BlogSubscriberFactory(
            organization=self.org, store=self.store, email="dup@example.com",
        )
        response = self.client.post(
            f"/api/v1/store/{self.store.slug}/blog/subscribe/",
            {"email": "dup@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_blog_subscribe_missing_email(self):
        response = self.client.post(
            f"/api/v1/store/{self.store.slug}/blog/subscribe/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_blog_pagination(self):
        for i in range(15):
            BlogPostFactory(
                organization=self.org, store=self.store,
                status="published", published_at=timezone.now(),
                title=f"Post {i}", slug=f"post-{i}",
            )
        response = self.client.get(
            f"/api/v1/store/{self.store.slug}/blog/?locale=en&page=1&per_page=5",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["posts"]), 5)
        self.assertEqual(response.data["pagination"]["total"], 16)
        self.assertTrue(response.data["pagination"]["has_next"])

    def test_blog_filter_by_category(self):
        cat = BlogCategoryFactory(
            organization=self.org, store=self.store, slug="tech",
        )
        BlogPostCategoryFactory(post=self.published_post, category=cat)
        response = self.client.get(
            f"/api/v1/store/{self.store.slug}/blog/?locale=en&category=tech",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["posts"]), 1)
