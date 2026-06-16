from __future__ import annotations

import factory

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


class BlogCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BlogCategory

    organization = factory.SubFactory("tests.factories.OrganizationFactory")
    store = factory.SubFactory("tests.factories.StoreFactory")
    name = factory.Sequence(lambda n: f"Category {n}")
    slug = factory.Sequence(lambda n: f"category-{n}")
    description = "Test category description"
    is_active = True
    order = 0


class BlogTagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BlogTag

    organization = factory.SubFactory("tests.factories.OrganizationFactory")
    store = factory.SubFactory("tests.factories.StoreFactory")
    name = factory.Sequence(lambda n: f"Tag {n}")
    slug = factory.Sequence(lambda n: f"tag-{n}")


class BlogAuthorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BlogAuthor

    organization = factory.SubFactory("tests.factories.OrganizationFactory")
    store = factory.SubFactory("tests.factories.StoreFactory")
    name = factory.Sequence(lambda n: f"Author {n}")
    slug = factory.Sequence(lambda n: f"author-{n}")
    bio = "Test author bio"


class BlogPostFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BlogPost

    organization = factory.SubFactory("tests.factories.OrganizationFactory")
    store = factory.SubFactory("tests.factories.StoreFactory")
    title = factory.Sequence(lambda n: f"Blog Post {n}")
    slug = factory.Sequence(lambda n: f"blog-post-{n}")
    excerpt = "Test excerpt"
    content = "<p>Test content</p>"
    status = "draft"
    reading_time = 1
    allow_comments = True
    is_featured = False
    view_count = 0


class BlogPostCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BlogPostCategory

    post = factory.SubFactory(BlogPostFactory)
    category = factory.SubFactory(BlogCategoryFactory)
    order = 0


class BlogPostTagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BlogPostTag

    post = factory.SubFactory(BlogPostFactory)
    tag = factory.SubFactory(BlogTagFactory)


class BlogCommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BlogComment

    organization = factory.SubFactory("tests.factories.OrganizationFactory")
    store = factory.SubFactory("tests.factories.StoreFactory")
    post = factory.SubFactory(BlogPostFactory)
    author_name = "Test User"
    author_email = "test@example.com"
    content = "Test comment content"
    status = "pending"
    is_guest = True


class BlogSubscriberFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BlogSubscriber

    organization = factory.SubFactory("tests.factories.OrganizationFactory")
    store = factory.SubFactory("tests.factories.StoreFactory")
    email = factory.Sequence(lambda n: f"subscriber{n}@example.com")
    is_active = True
