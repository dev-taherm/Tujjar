from __future__ import annotations

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.viewsets import TenantViewSet

from .models import (
    BlogAuthor,
    BlogCategory,
    BlogComment,
    BlogPost,
    BlogSettings,
    BlogSubscriber,
    BlogTag,
)
from .serializers import (
    BlogAuthorSerializer,
    BlogCategorySerializer,
    BlogCommentSerializer,
    BlogPostListSerializer,
    BlogPostSerializer,
    BlogSettingsSerializer,
    BlogSubscriberSerializer,
    BlogTagSerializer,
)


class BlogCategoryViewSet(TenantViewSet):
    """Blog category CRUD."""

    serializer_class = BlogCategorySerializer
    required_permission = "blog.create"

    def get_queryset(self):
        qs = BlogCategory.objects.filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_audit(
            action="blog.category.create",
            resource_type="blog_category",
            resource_id=instance.id,
            new_value=BlogCategorySerializer(instance).data,
        )

    def perform_update(self, serializer):
        old = BlogCategorySerializer(serializer.instance).data
        instance = serializer.save()
        self._log_audit(
            action="blog.category.update",
            resource_type="blog_category",
            resource_id=instance.id,
            old_value=old,
            new_value=BlogCategorySerializer(instance).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="blog.category.delete",
            resource_type="blog_category",
            resource_id=instance.id,
            old_value=BlogCategorySerializer(instance).data,
        )
        instance.delete()


class BlogTagViewSet(TenantViewSet):
    """Blog tag CRUD."""

    serializer_class = BlogTagSerializer
    required_permission = "blog.create"

    def get_queryset(self):
        qs = BlogTag.objects.filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_audit(
            action="blog.tag.create",
            resource_type="blog_tag",
            resource_id=instance.id,
            new_value=BlogTagSerializer(instance).data,
        )

    def perform_update(self, serializer):
        old = BlogTagSerializer(serializer.instance).data
        instance = serializer.save()
        self._log_audit(
            action="blog.tag.update",
            resource_type="blog_tag",
            resource_id=instance.id,
            old_value=old,
            new_value=BlogTagSerializer(instance).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="blog.tag.delete",
            resource_type="blog_tag",
            resource_id=instance.id,
            old_value=BlogTagSerializer(instance).data,
        )
        instance.delete()


class BlogAuthorViewSet(TenantViewSet):
    """Blog author CRUD."""

    serializer_class = BlogAuthorSerializer
    required_permission = "blog.create"

    def get_queryset(self):
        qs = BlogAuthor.objects.select_related("avatar").filter(
            organization_id=self.request.org_id,
        )
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_audit(
            action="blog.author.create",
            resource_type="blog_author",
            resource_id=instance.id,
            new_value=BlogAuthorSerializer(instance).data,
        )

    def perform_update(self, serializer):
        old = BlogAuthorSerializer(serializer.instance).data
        instance = serializer.save()
        self._log_audit(
            action="blog.author.update",
            resource_type="blog_author",
            resource_id=instance.id,
            old_value=old,
            new_value=BlogAuthorSerializer(instance).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="blog.author.delete",
            resource_type="blog_author",
            resource_id=instance.id,
            old_value=BlogAuthorSerializer(instance).data,
        )
        instance.delete()


class BlogPostViewSet(TenantViewSet):
    """Blog post CRUD with publishing workflow."""

    serializer_class = BlogPostSerializer
    required_permission = "blog.create"

    def get_queryset(self):
        qs = (
            BlogPost.objects.select_related("author", "featured_image", "og_image")
            .prefetch_related("post_categories__category", "post_tags__tag")
            .annotate(_comment_count=Count("comments", filter=Q(comments__status="approved")))
            .filter(organization_id=self.request.org_id)
        )
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        post_status = self.request.query_params.get("status")
        if post_status:
            qs = qs.filter(status=post_status)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(excerpt__icontains=search),
            )
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return BlogPostListSerializer
        return BlogPostSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_audit(
            action="blog.post.create",
            resource_type="blog_post",
            resource_id=instance.id,
            new_value=BlogPostSerializer(instance).data,
        )

    def perform_update(self, serializer):
        old = BlogPostSerializer(serializer.instance).data
        instance = serializer.save()
        self._log_audit(
            action="blog.post.update",
            resource_type="blog_post",
            resource_id=instance.id,
            old_value=old,
            new_value=BlogPostSerializer(instance).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="blog.post.delete",
            resource_type="blog_post",
            resource_id=instance.id,
            old_value=BlogPostSerializer(instance).data,
        )
        instance.delete()

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish the post."""
        post = self.get_object()
        post.status = BlogPost.Status.PUBLISHED
        post.published_at = timezone.now()
        post.save(update_fields=["status", "published_at", "updated_at"])
        return Response(BlogPostSerializer(post).data)

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        """Unpublish the post back to draft."""
        post = self.get_object()
        post.status = BlogPost.Status.DRAFT
        post.published_at = None
        post.save(update_fields=["status", "published_at", "updated_at"])
        return Response(BlogPostSerializer(post).data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive the post."""
        post = self.get_object()
        post.status = BlogPost.Status.ARCHIVED
        post.save(update_fields=["status", "updated_at"])
        return Response(BlogPostSerializer(post).data)

    @action(detail=True, methods=["post"], url_path="schedule")
    def schedule(self, request, pk=None):
        """Schedule the post for future publication."""
        post = self.get_object()
        scheduled_at = request.data.get("scheduled_at")
        if not scheduled_at:
            return Response(
                {"detail": "scheduled_at is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        post.status = BlogPost.Status.SCHEDULED
        post.scheduled_at = scheduled_at
        post.save(update_fields=["status", "scheduled_at", "updated_at"])
        return Response(BlogPostSerializer(post).data)

    @action(detail=True, methods=["post"], url_path="set-featured")
    def set_featured(self, request, pk=None):
        """Toggle featured status."""
        post = self.get_object()
        post.is_featured = not post.is_featured
        post.save(update_fields=["is_featured", "updated_at"])
        return Response({"is_featured": post.is_featured})

    @action(detail=True, methods=["get"])
    def stats(self, request, pk=None):
        """Get post analytics."""
        post = self.get_object()
        comments_qs = post.comments.all()
        return Response(
            {
                "view_count": post.view_count,
                "reading_time": post.reading_time,
                "comment_count": comments_qs.count(),
                "approved_comments": comments_qs.filter(status="approved").count(),
                "pending_comments": comments_qs.filter(status="pending").count(),
            }
        )

    @action(detail=True, methods=["post"], url_path="auto-save")
    def auto_save(self, request, pk=None):
        """Auto-save the post (for editor drafts)."""
        post = self.get_object()
        content = request.data.get("content", post.content)
        title = request.data.get("title", post.title)
        post.content = content
        post.title = title
        post.calculate_reading_time()
        post.save(update_fields=["title", "content", "reading_time", "updated_at"])
        return Response(
            {
                "saved": True,
                "updated_at": post.updated_at.isoformat(),
            }
        )

    @action(detail=False, methods=["post"], url_path="ai/generate")
    def ai_generate(self, request):
        """Generate blog post content using AI."""
        from apps.ai.services.content import ContentGenerator
        from apps.ai.views import _get_active_provider

        provider_config = _get_active_provider(request.org_id)
        if not provider_config:
            return Response(
                {"detail": "No active AI provider configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task_type = request.data.get("task_type", "blog_post")
        prompt = request.data.get("prompt", "")
        context = request.data.get("context", {})
        tone = request.data.get("tone", "professional")

        gen = ContentGenerator(provider_config)

        if task_type == "blog_post":
            full_prompt = f"""Write a blog post about: {prompt}
Tone: {tone}
Additional context: {context.get("extra", "")}

Generate a complete blog post with:
1. A compelling title
2. An engaging excerpt (2-3 sentences)
3. Full HTML content with proper headings, paragraphs, and formatting
4. SEO title (under 60 chars)
5. Meta description (under 160 chars)

Return as JSON: {{"title": "...", "excerpt": "...", "content": "<html>...</html>", "seo_title": "...", "seo_description": "..."}}"""

        elif task_type == "blog_post_from_topic":
            full_prompt = f"""Write a detailed blog post about: {prompt}
Tone: {tone}
Target audience: {context.get("audience", "general readers")}
Keywords to include: {context.get("keywords", "")}

Generate a comprehensive blog post with proper HTML formatting including headings (h2, h3), paragraphs, lists, and emphasis.

Return as JSON: {{"title": "...", "excerpt": "...", "content": "<html>..."}}"""

        elif task_type == "seo_optimize":
            existing_content = context.get("content", "")
            existing_title = context.get("title", "")
            full_prompt = f"""Optimize this blog post for SEO:

Title: {existing_title}
Content: {existing_content[:2000]}
Focus keyword: {prompt}

Provide:
1. Optimized title (under 60 chars, include keyword)
2. Optimized meta description (under 160 chars)
3. Suggested content improvements for SEO
4. Suggested internal/external link opportunities

Return as JSON: {{"seo_title": "...", "seo_description": "...", "suggestions": ["..."], "keywords": ["..."]}}"""

        elif task_type == "improve_content":
            existing_content = context.get("content", "")
            full_prompt = f"""Improve this blog post content:

Existing content: {existing_content[:3000]}
Improvement focus: {prompt}
Tone: {tone}

Improve the content for clarity, engagement, and readability while maintaining the original meaning.

Return as JSON: {{"improved_content": "<html>...", "changes_made": ["..."]}}"""

        elif task_type == "translate":
            existing_content = context.get("content", "")
            target_locale = context.get("locale", "ar")
            full_prompt = f"""Translate this blog post to {target_locale}:

Title: {context.get("title", "")}
Excerpt: {context.get("excerpt", "")}
Content: {existing_content[:3000]}

Provide a natural, culturally-appropriate translation.

Return as JSON: {{"title": "...", "excerpt": "...", "content": "<html>..."}}"""

        elif task_type == "suggest_image":
            full_prompt = f"""Suggest an image for this blog post:

Title: {context.get("title", "")}
Excerpt: {context.get("excerpt", "")}
Content summary: {context.get("content", "")[:500]}

Suggest:
1. Image description for stock photo search
2. Alt text for accessibility
3. Image placement recommendation

Return as JSON: {{"image_description": "...", "alt_text": "...", "placement": "..."}}"""

        else:
            return Response(
                {"detail": f"Unknown task_type: {task_type}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = gen.generate(task_type, full_prompt)

        return Response(
            {
                "content": result.get("content", ""),
                "tokens_used": result.get("tokens_used", 0),
                "is_success": result.get("is_success", False),
            }
        )

    @action(detail=True, methods=["post"], url_path="ai/improve")
    def ai_improve(self, request, pk=None):
        """Improve existing post content using AI."""
        from apps.ai.services.content import ContentGenerator
        from apps.ai.views import _get_active_provider

        provider_config = _get_active_provider(request.org_id)
        if not provider_config:
            return Response(
                {"detail": "No active AI provider configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        post = self.get_object()
        improvement_type = request.data.get("type", "readability")

        gen = ContentGenerator(provider_config)

        prompts = {
            "readability": f"Improve the readability of this blog post:\n\nTitle: {post.title}\nContent: {post.content[:3000]}\n\nMake it more engaging, clear, and easy to read. Return improved HTML content.",
            "seo": f'Optimize this blog post for SEO:\n\nTitle: {post.title}\nSEO Title: {post.seo_title}\nMeta Description: {post.seo_description}\nContent: {post.content[:3000]}\n\nProvide optimized SEO title, meta description, and content suggestions. Return as JSON: {{"seo_title": "...", "seo_description": "...", "content": "<html>..."}}',
            "engagement": f"Make this blog post more engaging:\n\nTitle: {post.title}\nContent: {post.content[:3000]}\n\nAdd more hooks, stories, questions, and calls-to-action. Return improved HTML content.",
            "grammar": f"Fix all grammar and spelling errors in this blog post:\n\nTitle: {post.title}\nContent: {post.content[:3000]}\n\nReturn the corrected HTML content.",
        }

        prompt = prompts.get(improvement_type, prompts["readability"])
        result = gen.generate(f"blog_improve_{improvement_type}", prompt)

        return Response(
            {
                "content": result.get("content", ""),
                "improvement_type": improvement_type,
                "tokens_used": result.get("tokens_used", 0),
            }
        )


class BlogCommentViewSet(TenantViewSet):
    """Blog comment CRUD with moderation."""

    serializer_class = BlogCommentSerializer
    required_permission = "blog.manage_comments"

    def get_queryset(self):
        qs = BlogComment.objects.filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        post_id = self.request.query_params.get("post")
        if post_id:
            qs = qs.filter(post_id=post_id)
        comment_status = self.request.query_params.get("status")
        if comment_status:
            qs = qs.filter(status=comment_status)
        return qs.select_related("user").order_by("-created_at")

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_audit(
            action="blog.comment.create",
            resource_type="blog_comment",
            resource_id=instance.id,
            new_value=BlogCommentSerializer(instance).data,
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve a comment."""
        comment = self.get_object()
        comment.status = BlogComment.Status.APPROVED
        comment.save(update_fields=["status", "updated_at"])
        return Response(BlogCommentSerializer(comment).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Mark a comment as spam."""
        comment = self.get_object()
        comment.status = BlogComment.Status.SPAM
        comment.save(update_fields=["status", "updated_at"])
        return Response(BlogCommentSerializer(comment).data)

    @action(detail=True, methods=["post"])
    def trash(self, request, pk=None):
        """Move a comment to trash."""
        comment = self.get_object()
        comment.status = BlogComment.Status.TRASH
        comment.save(update_fields=["status", "updated_at"])
        return Response(BlogCommentSerializer(comment).data)

    @action(detail=False, methods=["post"], url_path="approve-all")
    def approve_all(self, request):
        """Approve all pending comments for a store."""
        store_id = request.data.get("store")
        if not store_id:
            return Response(
                {"detail": "store is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        count = BlogComment.objects.filter(
            organization_id=request.org_id,
            store_id=store_id,
            status=BlogComment.Status.PENDING,
        ).update(status=BlogComment.Status.APPROVED)
        return Response({"approved": count})


class BlogSubscriberViewSet(TenantViewSet):
    """Blog subscriber management."""

    serializer_class = BlogSubscriberSerializer
    required_permission = "blog.manage_subscribers"

    def get_queryset(self):
        qs = BlogSubscriber.objects.filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_audit(
            action="blog.subscriber.create",
            resource_type="blog_subscriber",
            resource_id=instance.id,
            new_value=BlogSubscriberSerializer(instance).data,
        )

    @action(detail=True, methods=["post"])
    def unsubscribe(self, request, pk=None):
        """Unsubscribe from the blog."""
        subscriber = self.get_object()
        subscriber.is_active = False
        subscriber.unsubscribed_at = timezone.now()
        subscriber.save(update_fields=["is_active", "unsubscribed_at", "updated_at"])
        return Response({"detail": "Unsubscribed successfully."})


class BlogPublicCommentView(generics.CreateAPIView):
    """Public endpoint for creating comments (supports guest comments)."""

    serializer_class = BlogCommentSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        post_id = kwargs.get("post_id")
        try:
            post = BlogPost.objects.get(id=post_id, status="published")
        except BlogPost.DoesNotExist:
            return Response(
                {"detail": "Post not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not post.allow_comments:
            return Response(
                {"detail": "Comments are disabled for this post."},
                status=status.HTTP_403_FORBIDDEN,
            )
        data = request.data.copy()
        data["post"] = str(post.id)
        data["store"] = str(post.store_id)

        if request.user.is_authenticated:
            data["user"] = str(request.user.id)
            data["is_guest"] = False
        else:
            data["is_guest"] = True
            if not data.get("author_name") or not data.get("author_email"):
                return Response(
                    {"detail": "Name and email are required for guest comments."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = self.get_serializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BlogPublicSubscribeView(generics.CreateAPIView):
    """Public endpoint for subscribing to the blog newsletter."""

    serializer_class = BlogSubscriberSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        kwargs.get("post_id")
        store_id = request.data.get("store")
        if not store_id:
            return Response(
                {"detail": "store is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        email = request.data.get("email")
        if not email:
            return Response(
                {"detail": "email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        existing = BlogSubscriber.objects.filter(
            store_id=store_id,
            email=email,
        ).first()
        if existing:
            if existing.is_active:
                return Response(
                    {"detail": "You are already subscribed."},
                    status=status.HTTP_409_CONFLICT,
                )
            existing.is_active = True
            existing.unsubscribed_at = None
            existing.save(update_fields=["is_active", "unsubscribed_at", "updated_at"])
            return Response({"detail": "Welcome back! You have been re-subscribed."})

        data = request.data.copy()
        if request.user.is_authenticated:
            data["user"] = str(request.user.id)

        serializer = self.get_serializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Subscribed successfully!"}, status=status.HTTP_201_CREATED)


class BlogSettingsViewSet(TenantViewSet):
    """Per-store blog settings."""

    serializer_class = BlogSettingsSerializer
    required_permission = "settings.manage"

    def get_queryset(self):
        qs = BlogSettings.objects.filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()
