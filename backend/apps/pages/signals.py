from __future__ import annotations

from django.db.models.signals import post_save
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
