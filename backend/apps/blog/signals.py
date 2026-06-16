from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver


@receiver(post_save, sender="blog.BlogPost")
def blog_post_saved(sender, instance, **kwargs):
    """Auto-calculate reading time and update search index on save."""
    instance.calculate_reading_time()
    if instance.reading_time != sender.objects.filter(pk=instance.pk).values_list("reading_time", flat=True).first():
        sender.objects.filter(pk=instance.pk).update(reading_time=instance.reading_time)

    from apps.blog.tasks import update_search_index_for_blog_post
    update_search_index_for_blog_post.delay(str(instance.id))


@receiver(post_delete, sender="blog.BlogPost")
def blog_post_deleted(sender, instance, **kwargs):
    """Clean up search index on delete."""
    from apps.search.models import SearchIndex
    SearchIndex.objects.filter(
        organization_id=instance.organization_id,
        entity_type="blog_post",
        entity_id=instance.id,
    ).delete()
