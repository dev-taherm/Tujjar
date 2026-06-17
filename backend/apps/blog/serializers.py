from __future__ import annotations

from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers

from apps.core.utils import resolve_organization

from .models import (
    BlogAuthor,
    BlogCategory,
    BlogComment,
    BlogPost,
    BlogPostCategory,
    BlogPostTag,
    BlogSubscriber,
    BlogTag,
)


class BlogCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogCategory
        fields = [
            "id", "organization", "store", "name", "slug", "description",
            "featured_image", "seo_title", "seo_description", "og_image",
            "translations", "is_active", "order", "post_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def get_post_count(self, obj) -> int:
        return obj.category_posts.filter(post__status="published").count()

    def validate_slug(self, value):
        slug = slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        store_id = self.initial_data.get("store")
        if not store_id:
            return slug
        qs = BlogCategory.objects.filter(slug=slug, store_id=store_id)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This slug is already taken for this store.")
        return slug

    def create(self, validated_data):
        validated_data["organization"] = resolve_organization(self.context["request"].org_id)
        return super().create(validated_data)


class BlogTagSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogTag
        fields = [
            "id", "organization", "store", "name", "slug", "description",
            "translations", "post_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def get_post_count(self, obj) -> int:
        return obj.tag_posts.filter(post__status="published").count()

    def validate_slug(self, value):
        slug = slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        store_id = self.initial_data.get("store")
        if not store_id:
            return slug
        qs = BlogTag.objects.filter(slug=slug, store_id=store_id)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This slug is already taken for this store.")
        return slug

    def create(self, validated_data):
        validated_data["organization"] = resolve_organization(self.context["request"].org_id)
        return super().create(validated_data)


class BlogAuthorSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = BlogAuthor
        fields = [
            "id", "organization", "store", "user", "name", "slug", "bio",
            "avatar", "avatar_url", "social_links", "translations",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def get_avatar_url(self, obj) -> str | None:
        if obj.avatar and hasattr(obj.avatar, "file"):
            return obj.avatar.file.url if obj.avatar.file else None
        return None

    def validate_slug(self, value):
        slug = slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        store_id = self.initial_data.get("store")
        if not store_id:
            return slug
        qs = BlogAuthor.objects.filter(slug=slug, store_id=store_id)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This slug is already taken for this store.")
        return slug

    def create(self, validated_data):
        validated_data["organization"] = resolve_organization(self.context["request"].org_id)
        return super().create(validated_data)


class BlogPostCategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="category.name", read_only=True)
    slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = BlogPostCategory
        fields = ["id", "category", "name", "slug", "order"]


class BlogPostTagSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="tag.name", read_only=True)
    slug = serializers.CharField(source="tag.slug", read_only=True)

    class Meta:
        model = BlogPostTag
        fields = ["id", "tag", "name", "slug"]


class BlogPostSerializer(serializers.ModelSerializer):
    author_detail = BlogAuthorSerializer(source="author", read_only=True)
    categories_detail = BlogPostCategorySerializer(source="post_categories", many=True, read_only=True)
    tags_detail = BlogPostTagSerializer(source="post_tags", many=True, read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    reading_time = serializers.IntegerField(read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id", "organization", "store", "title", "slug", "excerpt", "content",
            "featured_image", "featured_image_url", "featured_image_alt",
            "author", "author_detail",
            "status", "published_at", "scheduled_at",
            "categories", "categories_detail",
            "tags", "tags_detail",
            "seo_title", "seo_description", "og_image", "og_image_url",
            "twitter_card", "canonical_url", "focus_keyword",
            "translations", "reading_time", "allow_comments", "is_featured",
            "view_count", "expires_at", "comment_count",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "organization", "reading_time", "view_count",
            "created_at", "updated_at",
        ]

    def get_featured_image_url(self, obj) -> str | None:
        if obj.featured_image and obj.featured_image.file_url:
            return obj.featured_image.file_url
        return None

    def get_og_image_url(self, obj) -> str | None:
        if obj.og_image and obj.og_image.file_url:
            return obj.og_image.file_url
        return None

    def get_comment_count(self, obj) -> int:
        return obj.comments.filter(status="approved").count()

    def validate_slug(self, value):
        slug = slugify(value)
        if not slug:
            raise serializers.ValidationError("Invalid slug.")
        store_id = self.initial_data.get("store")
        if not store_id:
            return slug
        qs = BlogPost.objects.filter(slug=slug, store_id=store_id)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This slug is already taken for this store.")
        return slug

    def create(self, validated_data):
        validated_data["organization"] = resolve_organization(self.context["request"].org_id)
        if validated_data.get("status") == BlogPost.Status.PUBLISHED and not validated_data.get("published_at"):
            validated_data["published_at"] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        new_status = validated_data.get("status", instance.status)
        if new_status == BlogPost.Status.PUBLISHED and not instance.published_at:
            validated_data["published_at"] = timezone.now()
        return super().update(instance, validated_data)


class BlogPostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    author_name = serializers.CharField(source="author.name", read_only=True, default="")
    featured_image_url = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "excerpt",
            "featured_image_url", "author_name",
            "status", "published_at", "reading_time",
            "is_featured", "view_count", "comment_count",
            "created_at",
        ]

    def get_featured_image_url(self, obj) -> str | None:
        if obj.featured_image and hasattr(obj.featured_image, "file"):
            return obj.featured_image.file.url if obj.featured_image.file else None
        return None

    def get_comment_count(self, obj) -> int:
        return getattr(obj, "_cached_comment_count", None) or 0


class BlogCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = BlogComment
        fields = [
            "id", "organization", "store", "post", "parent",
            "user", "author_name", "author_email", "author_website",
            "content", "status", "is_guest", "replies",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization", "status", "is_guest", "created_at", "updated_at"]

    def get_author_name(self, obj) -> str:
        if obj.user:
            return obj.user.email.split("@")[0]
        return obj.author_name or "Anonymous"

    def get_replies(self, obj):
        if obj.parent_id:
            return []
        replies = obj.replies.filter(status="approved").order_by("created_at")
        return BlogCommentSerializer(replies, many=True, context=self.context).data


class BlogSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogSubscriber
        fields = [
            "id", "organization", "store", "email", "user",
            "is_active", "subscribed_at", "unsubscribed_at",
        ]
        read_only_fields = ["id", "organization", "subscribed_at", "unsubscribed_at"]

    def create(self, validated_data):
        validated_data["organization"] = resolve_organization(self.context["request"].org_id)
        return super().create(validated_data)
