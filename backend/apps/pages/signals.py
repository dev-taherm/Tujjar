from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver


@receiver(post_save, sender="stores.Store")
def create_homepage_for_store(sender, instance, created, **kwargs):
    """Create a default homepage when a store is created."""
    if created:
        from .models import Page

        Page.objects.create(
            organization=instance.organization,
            store=instance,
            title="Homepage",
            slug="",
            page_type="homepage",
            content_schema={"sections": []},
            is_published=False,
        )


@receiver(post_save, sender="pages.Page")
def invalidate_store_seo_on_page_save(sender, instance, **kwargs):
    """Published pages appear in robots.txt and the sitemap."""
    if not instance.store_id:
        return
    from apps.storefront.cache import invalidate_store_seo

    invalidate_store_seo(instance.store.slug)


@receiver(post_delete, sender="pages.Page")
def invalidate_store_seo_on_page_delete(sender, instance, **kwargs):
    if not instance.store_id:
        return
    from apps.storefront.cache import invalidate_store_seo

    invalidate_store_seo(instance.store.slug)
