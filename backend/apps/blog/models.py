from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


class BlogCategory(UUIDModel, TimeStampedModel):
    """A blog category for organizing posts."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="blog_categories",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="blog_categories",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, default="")
    featured_image = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_category_images",
    )
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")
    og_image = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_category_og_images",
    )
    translations = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    objects = TenantManager()
    unscoped = UnscopedManager()

    class Meta:
        ordering = ["order", "name"]
        unique_together = ["organization", "store", "slug"]

    def __str__(self):
        return self.name


class BlogTag(UUIDModel, TimeStampedModel):
    """A blog tag for labeling posts."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="blog_tags",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="blog_tags",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, default="")
    translations = models.JSONField(default=dict, blank=True)

    objects = TenantManager()
    unscoped = UnscopedManager()

    class Meta:
        ordering = ["name"]
        unique_together = ["organization", "store", "slug"]

    def __str__(self):
        return self.name


class BlogAuthor(UUIDModel, TimeStampedModel):
    """A blog author — can be linked to a User or standalone."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="blog_authors",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="blog_authors",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_author_profiles",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    bio = models.TextField(blank=True, default="")
    avatar = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_author_avatars",
    )
    social_links = models.JSONField(default=dict, blank=True)
    translations = models.JSONField(default=dict, blank=True)

    objects = TenantManager()
    unscoped = UnscopedManager()

    class Meta:
        ordering = ["name"]
        unique_together = ["organization", "store", "slug"]

    def __str__(self):
        return self.name


class BlogPost(UUIDModel, TimeStampedModel):
    """A blog post."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        SCHEDULED = "scheduled", "Scheduled"
        ARCHIVED = "archived", "Archived"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="blog_posts",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="blog_posts",
    )
    title = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500)
    excerpt = models.TextField(blank=True, default="")
    content = models.TextField(blank=True, default="")

    featured_image = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_post_images",
    )
    featured_image_alt = models.CharField(max_length=255, blank=True, default="")

    author = models.ForeignKey(
        BlogAuthor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)

    categories = models.ManyToManyField(
        BlogCategory,
        through="BlogPostCategory",
        related_name="posts",
        blank=True,
    )
    tags = models.ManyToManyField(
        BlogTag,
        through="BlogPostTag",
        related_name="posts",
        blank=True,
    )

    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")
    og_image = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_post_og_images",
    )
    twitter_card = models.CharField(
        max_length=20,
        choices=[
            ("summary", "Summary"),
            ("summary_large_image", "Summary Large Image"),
        ],
        default="summary_large_image",
    )
    canonical_url = models.URLField(max_length=500, blank=True, default="")
    focus_keyword = models.CharField(max_length=255, blank=True, default="")

    translations = models.JSONField(default=dict, blank=True)
    reading_time = models.IntegerField(default=0, help_text="Estimated reading time in minutes")
    allow_comments = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    view_count = models.IntegerField(default=0)

    expires_at = models.DateTimeField(null=True, blank=True)

    objects = TenantManager()
    unscoped = UnscopedManager()

    class Meta:
        ordering = ["-published_at", "-created_at"]
        unique_together = ["organization", "store", "slug"]
        indexes = [
            models.Index(fields=["organization", "store", "status"]),
            models.Index(fields=["organization", "store", "published_at"]),
            models.Index(fields=["organization", "store", "is_featured"]),
        ]

    def __str__(self):
        return self.title

    def calculate_reading_time(self):
        """Estimate reading time from content (avg 200 words per minute)."""
        import re

        text = re.sub(r"<[^>]+>", " ", self.content or "")
        words = len(text.split())
        self.reading_time = max(1, round(words / 200))

    def increment_view_count(self):
        """Atomically increment view count."""
        BlogPost.objects.filter(pk=self.pk).update(view_count=models.F("view_count") + 1)


class BlogPostCategory(UUIDModel):
    """Through model for BlogPost <-> BlogCategory with ordering."""

    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name="post_categories")
    category = models.ForeignKey(
        BlogCategory, on_delete=models.CASCADE, related_name="category_posts"
    )
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = ["post", "category"]


class BlogPostTag(UUIDModel):
    """Through model for BlogPost <-> BlogTag."""

    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name="post_tags")
    tag = models.ForeignKey(BlogTag, on_delete=models.CASCADE, related_name="tag_posts")

    class Meta:
        unique_together = ["post", "tag"]


class BlogComment(UUIDModel, TimeStampedModel):
    """A comment on a blog post, supporting nested replies."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        SPAM = "spam", "Spam"
        TRASH = "trash", "Trash"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="blog_comments",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="blog_comments",
    )
    post = models.ForeignKey(
        BlogPost,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_comments",
    )
    author_name = models.CharField(max_length=255, blank=True, default="")
    author_email = models.EmailField(blank=True, default="")
    author_website = models.URLField(max_length=500, blank=True, default="")
    content = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    is_guest = models.BooleanField(default=False)

    objects = TenantManager()
    unscoped = UnscopedManager()

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["organization", "store", "post", "status"]),
        ]

    def __str__(self):
        author = self.author_name or (self.user.email if self.user else "Unknown")
        return f"Comment by {author} on {self.post.title}"


class BlogSubscriber(UUIDModel, TimeStampedModel):
    """A blog newsletter subscriber."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="blog_subscribers",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="blog_subscribers",
    )
    email = models.EmailField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_subscriptions",
    )
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)

    objects = TenantManager()
    unscoped = UnscopedManager()

    class Meta:
        ordering = ["-subscribed_at"]
        unique_together = ["organization", "store", "email"]

    def __str__(self):
        return self.email


class BlogSettings(UUIDModel, TimeStampedModel):
    """Per-store blog configuration."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="blog_settings",
    )
    store = models.OneToOneField(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="blog_settings",
    )
    posts_per_page = models.PositiveIntegerField(default=10)
    default_status = models.CharField(
        max_length=20,
        choices=[("draft", "Draft"), ("published", "Published")],
        default="draft",
    )
    allow_comments = models.BooleanField(default=True)
    comment_moderation = models.BooleanField(default=True)
    show_author_bio = models.BooleanField(default=True)
    rss_enabled = models.BooleanField(default=True)

    objects = TenantManager()
    unscoped = UnscopedManager()

    class Meta:
        verbose_name_plural = "blog settings"

    def __str__(self):
        return f"Blog Settings for {self.store}"
