from __future__ import annotations

from celery import shared_task
from django.utils import timezone


@shared_task
def update_search_index_for_blog_post(post_id: str):
    """Sync a blog post into the search index."""
    from apps.blog.models import BlogPost
    from apps.search.models import SearchIndex

    try:
        post = BlogPost.unscoped.get(id=post_id)
    except BlogPost.DoesNotExist:
        return

    import re
    plain_text = re.sub(r"<[^>]+>", " ", post.content or "")
    plain_text = re.sub(r"\s+", " ", plain_text).strip()[:500]

    SearchIndex.objects.update_or_create(
        organization_id=post.organization_id,
        entity_type="blog_post",
        entity_id=post.id,
        defaults={
            "store_id": post.store_id,
            "title": post.title,
            "description": post.excerpt or plain_text,
            "tags": {
                "categories": list(post.categories.values_list("name", flat=True)),
                "tags": list(post.tags.values_list("name", flat=True)),
            },
            "boost": 1.0 if post.status == "published" else 0.5,
        },
    )


@shared_task
def publish_scheduled_posts():
    """Publish posts whose scheduled_at has passed."""
    from apps.blog.models import BlogPost

    now = timezone.now()
    posts = BlogPost.objects.filter(
        status=BlogPost.Status.SCHEDULED,
        scheduled_at__lte=now,
    )
    count = 0
    for post in posts:
        post.status = BlogPost.Status.PUBLISHED
        post.published_at = now
        post.save(update_fields=["status", "published_at", "updated_at"])
        count += 1
    return f"Published {count} scheduled posts"


@shared_task
def expire_posts():
    """Archive posts that have passed their expires_at date."""
    from apps.blog.models import BlogPost

    now = timezone.now()
    count = BlogPost.objects.filter(
        status=BlogPost.Status.PUBLISHED,
        expires_at__isnull=False,
        expires_at__lte=now,
    ).update(status=BlogPost.Status.ARCHIVED)
    return f"Archived {count} expired posts"
