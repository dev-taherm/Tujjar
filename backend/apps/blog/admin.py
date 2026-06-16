from __future__ import annotations

from django.contrib import admin

from apps.core.admin import TenantAdminMixin

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


class BlogPostCategoryInline(TenantAdminMixin, admin.TabularInline):
    model = BlogPostCategory
    extra = 1


class BlogPostTagInline(TenantAdminMixin, admin.TabularInline):
    model = BlogPostTag
    extra = 1


@admin.register(BlogCategory)
class BlogCategoryAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "store", "is_active", "order", "created_at"]
    list_filter = ["is_active", "store"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(BlogTag)
class BlogTagAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "store", "created_at"]
    list_filter = ["store"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(BlogAuthor)
class BlogAuthorAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["name", "store", "user", "created_at"]
    list_filter = ["store"]
    search_fields = ["name", "slug"]


@admin.register(BlogPost)
class BlogPostAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["title", "store", "author", "status", "published_at", "view_count", "is_featured"]
    list_filter = ["status", "is_featured", "store"]
    search_fields = ["title", "slug", "excerpt"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [BlogPostCategoryInline, BlogPostTagInline]
    date_hierarchy = "published_at"
    list_editable = ["status", "is_featured"]


@admin.register(BlogComment)
class BlogCommentAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["__str__", "post", "status", "is_guest", "created_at"]
    list_filter = ["status", "is_guest", "store"]
    search_fields = ["author_name", "author_email", "content"]
    list_editable = ["status"]


@admin.register(BlogSubscriber)
class BlogSubscriberAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ["email", "store", "is_active", "subscribed_at"]
    list_filter = ["is_active", "store"]
    search_fields = ["email"]
